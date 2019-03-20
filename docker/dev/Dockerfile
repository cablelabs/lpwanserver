FROM node:10.15

RUN npm install -g nodemon

WORKDIR /usr/src/app

COPY bin/rest bin/rest
COPY config config
COPY data data
COPY prisma/dev prisma/dev
COPY restApp.js ./restApp.js
COPY package*.json ./

RUN npm install --production

EXPOSE 8080

CMD ["nodemon", "bin/rest", "--watch", "rest"]