FROM node:10.15

# set working directory
WORKDIR /app

# Copy project files
COPY bin/rest bin/rest
COPY config config
COPY prisma/dev prisma/dev
COPY restApp.js ./restApp.js
COPY server.js ./server.js
COPY public public
COPY rest rest
COPY package*.json ./

RUN npm install --production

EXPOSE 3200

CMD [ "node", "./bin/rest" ]
