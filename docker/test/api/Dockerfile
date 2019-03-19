FROM node:10.15

# set working directory
WORKDIR /app

RUN npm install -g mocha

# Copy project file
COPY package*.json ./

# install all dependencies, not dev dependencies
RUN npm install

# copy all project
COPY . .
COPY test2.0 test2.0

# Override the command, to run the test instead of the application
CMD ["mocha", "./test2.0/api", "--recursive", "--reporter", "spec", "--exit", "--bail", "--timeout", "10000"]
