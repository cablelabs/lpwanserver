FROM node:10.15

# set working directory
WORKDIR /usr/src/app

# Copy project files
COPY bin/rest bin/rest
COPY config config
COPY prisma/generated prisma/generated
COPY lib/prisma-cache lib/prisma-cache
COPY restApp.js ./restApp.js
COPY server.js ./server.js
COPY public public
COPY rest rest
COPY package*.json ./

RUN npm install --production

EXPOSE 3200

CMD [ "node", "./bin/rest" ]
