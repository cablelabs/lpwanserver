FROM node:10.15

RUN npm install -g nodemon

WORKDIR /usr/src/app

COPY bin/rest bin/rest
COPY config config
COPY prisma/generated prisma/generated
COPY lib/prisma-cache lib/prisma-cache
COPY restApp.js ./restApp.js
COPY server.js ./server.js
COPY public public
COPY package*.json ./

RUN npm install --production

EXPOSE 8080

CMD ["nodemon", "bin/rest", "--watch", "rest"]
