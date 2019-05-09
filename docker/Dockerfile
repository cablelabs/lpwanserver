FROM node:10.15

# set working directory
WORKDIR /app

# Copy project file
COPY package*.json ./

# install ALL node_modules, including 'devDependencies'
RUN npm install

# copy all project
COPY . .

EXPOSE 3200

CMD [ "node", "./bin/rest" ]
