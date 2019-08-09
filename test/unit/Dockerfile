FROM node:10.15

WORKDIR /app

COPY package*.json ./
COPY app app
COPY development/config.json app/config/dev.json
COPY test/unit test/unit

RUN npm install

# Prevent server from attempting to serve UI
ENV public_dir=

CMD ["npm", "run", "test:unit"]
