APP_NAME=mark-pdf

start: 
	pm2 start app.js --name=${APP_NAME}

stop: 
	pm2 stop ${APP_NAME}

kill: 
	pm2 del ${APP_NAME}

logs: 
	pm2 logs ${APP_NAME}

restart:
	pm2 restart ${APP_NAME} --update-env