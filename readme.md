# mark-pdf

> Markdown to PDF converter

## Why ?

There's a lot of bogus ones, and one's that just use chromium based SVG
snapshotting, which works, but then the quality is not that great and often has
issues with styling and page breaks.

## Usage

There's a hosted version that you can use for quick tranforms but if you do this quite often and
also have issues where storing files on someone else's server is a no-go then do self host this
project instead.

It's a simple Koa server and the requirements are very minute.

**Requirements**

- Node.js (>=v16.20.0) - Re-check `.nvmrc` to know which version is currently being used with the project
- Docker - The app executes a few docker commands so make sure docker in installed and available via the command-line. You can validate this by running the following command

```sh
docker run hello-world
```

### Setup

```sh
npm i -g pnpm@8.6.2
pnpm i

# for a dev server
pnpm dev

# for a prod server
pnpm start
```

We recommend using something like [pm2](https://pm2.keymetrics.io/)(`npm i -g pm2`) or any other process runner that you might like instead of directly running `node app.js` unless you are using some other form of orchestration (docker compose / swarm , k8s etc)

## FAQ

**My file is not downloadable any more** ?\
The server is programmed to delete files every 5 minutes after upload, this is to reduce costs on the server, since it's being provided for free right now. If you are hosting this on a local network (Raspberry Pi, Zero,etc) you can remove the `FileDelete$.next` lines from the `app.js` or set the delay to `Infinity` in `app.js`
