FROM node:10.15

WORKDIR /usr/src

COPY package*.json ./
COPY app app
COPY development/config.json config.json
COPY test/unit test/unit

RUN npm install

# Prevent server from attempting to serve UI
ENV public_dir=""

CMD ["npm", "run", "test:unit"]
