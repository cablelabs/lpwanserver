FROM node:10.15

# set working directory
WORKDIR /usr/src/app

RUN npm install -g mocha

# Copy project files
COPY test test
COPY prisma/generated prisma/generated
COPY lib/axios-rest-client lib/axios-rest-client
COPY lib/seeder lib/seeder
COPY rest-client rest-client

# Because LoRa clients are imported from rest folder
COPY rest rest
COPY config config

COPY package*.json ./

# install all dependencies
RUN npm install

# Override the command, to run the test instead of the application
CMD ["mocha", "--opts", "./test/e2e/mocha.opts"]
