FROM node:10.15

# set working directory
WORKDIR /usr/src

# Copy project files
COPY app app
COPY package*.json ./

RUN npm install --production

EXPOSE 3200

CMD [ "node", "app/index.js" ]
