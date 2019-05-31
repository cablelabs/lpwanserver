FROM node:10.15

# set working directory
WORKDIR /usr/src/app

RUN npm install -g mocha

# Copy project file
COPY test test
COPY prisma/generated prisma/generated
# COPY rest rest
# COPY restApp.js restApp.js
# COPY server.js server.js
COPY package*.json ./

# install all dependencies
RUN npm install

# Override the command, to run the test instead of the application
CMD ["mocha", "./test/e2e/specs", "--opts", "./test/e2e/mocha.opts"]
