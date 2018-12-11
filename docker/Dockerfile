FROM node:8

# set working directory
WORKDIR /app

# Copy project file
COPY package*.json ./

# install ALL node_modules, including 'devDependencies'
RUN npm install

# copy all project
COPY . .

# see config.hjson for a description of env variables

EXPOSE 3200

CMD [ "node", "./bin/rest" ]