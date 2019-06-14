FROM node:10.15

# set working directory
WORKDIR /app

RUN npm i -g mocha nyc

# Copy project file
COPY package*.json ./

# install all dependencies, not dev dependencies
RUN npm install

# copy all project
COPY . .

CMD ["nyc", "--reporter=lcovonly", "mocha", "test2.0/unit", "--recursive", "--file", "test2.0/unit/setup.js"]
