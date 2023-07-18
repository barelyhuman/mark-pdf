require("dotenv").config();

const Koa = require("koa");
const { Subject, delay } = require("rxjs");
const Router = require("koa-trie-router");
const koaBody = require("koa-body").default;
const static = require("koa-static");
const path = require("path");
const fs = require("fs");
const { spawn, spawnSync } = require("child_process");

const PORT = process.env.PORT || 3000;
const originHost = process.env.ORIGIN_URL || `http://localhost:${PORT}`;

const app = new Koa();
const router = new Router();

// Reactive Event Streams
const FileUploaded$ = new Subject();
const FileDelete$ = new Subject();

// Initialize
boot();

function boot() {
  console.log("Booting....");

  // Prepare docker with the required image
  spawnSync("docker", ["pull", "pandoc/extra"]);

  // Prepare uploads folder
  fs.mkdirSync(path.resolve(__dirname, "./uploads"), {
    recursive: true,
  });

  app.use(static(path.join(__dirname, "public")));
  app.use(
    koaBody({
      multipart: true,
      formidable: {
        uploadDir: "./uploads",
        keepExtensions: true,
      },
    })
  );

  prepareRoutes(app, router, {
    FileUploaded$,
    FileDelete$,
  });

  app.use(router.middleware());

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

function prepareRoutes(app, router, streams) {
  router.post("/api/upload", async (ctx, next) => {
    const file = ctx.request.files.file;
    ctx.type = "application/json";
    ctx.body = {
      name: file.newFilename.replace(path.extname(file.newFilename), ""),
    };
    streams.FileUploaded$.next(file);
    return;
  });

  router.get("/api/generated/:filename", async (ctx) => {
    const filename = ctx.params.filename;
    const outputFile =
      filename.replace(path.extname(ctx.params.filename), "") + ".pdf";

    const exists = fs.existsSync(
      path.resolve(__dirname, "public", "processed", outputFile)
    );

    if (!exists) {
      ctx.type = "application/json";
      ctx.body = {
        processing: true,
      };
      return;
    }

    ctx.type = "application/json";
    ctx.body = {
      processed: true,
      filename: outputFile,
      downloadLink: new URL(`/processed/${outputFile}`, originHost),
    };
    streams.FileDelete$.next(path.resolve(__dirname, "public", outputFile));
    return;
  });
}

FileUploaded$.subscribe((value) => {
  const filePath = value.filepath;
  const rel = path.relative(__dirname, filePath);
  let outputFile = path.basename(rel);
  outputFile = outputFile.replace(path.extname(outputFile), ".pdf");

  fs.mkdirSync(path.resolve(__dirname, "public", "processed"), {
    recursive: true,
  });

  const command = spawn(
    "docker",
    [
      "run",
      "--rm",
      "--volume",
      `${__dirname}:/data`,
      "pandoc/extra",
      `./${rel}`,
      `-o`,
      `./public/processed/${outputFile}`,
      "--template",
      "eisvogel",
      "--listings",
    ],
    {
      cwd: __dirname,
      detached: true,
    }
  );

  command.stderr.on("data", (data) => {
    // DEBUG
    // console.error(`stderr: ${data}`);
  });

  command.stdout.on("data", (d) => {
    // DEBUG
    // console.log(d.toString());
  });

  command.on("close", (code) => {
    // DEBUG
    // console.log(`child process exited with code ${code}`);
  });

  FileDelete$.next(filePath);
});

FileDelete$.pipe(
  delay(
    // every 5 minutes
    5 * 60 * 1000
  )
).subscribe((file) => {
  fs.rm(file, (err) => {
    if (err) {
      return console.error(`Error deleteing file: ${file}`);
    }
    console.log(`File Deleted: ${file}`);
  });
});
