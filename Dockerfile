FROM node:10.15

# set working directory
WORKDIR /usr/src/app

# Copy project files
COPY app .
COPY package*.json ./

RUN npm install --production

EXPOSE 3200

CMD [ "node", "./bin/rest" ]
