FROM node:10.15

WORKDIR /app

RUN npm i -g mocha nyc

COPY package*.json ./
COPY app app
COPY development/config.json app/config/dev.json
COPY test/unit test/unit

RUN npm install

# Prevent server from attempting to serve UI
ENV public_dir=

CMD ["nyc", "--reporter=lcovonly", "mocha", "test/unit", "--recursive", "--file", "test/unit/setup.js"]
