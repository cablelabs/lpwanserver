FROM node:10.15

WORKDIR /app

COPY package*.json ./
COPY app app
COPY development/config.json app/config/dev.json
COPY test/e2e test/e2e
COPY test/networks test/networks
COPY test/lib test/lib
COPY test/data test/data

RUN npm install

# Prevent server from attempting to serve UI
ENV public_dir=

CMD ["npm", "run", "test:e2e"]
