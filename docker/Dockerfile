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
ENV log_format_morgan=
ENV logging_enabled=
ENV logging_headers=
ENV jwt_algo=
ENV jwt_secret=
ENV jwt_ttl=
ENV jwt_issuer=
ENV bind_address=
ENV port=
ENV ssl_key_file=
ENV ssl_cert_file=
ENV base_url=
ENV impl_directory=
ENV db_schema=
ENV db_create=
ENV db_file=
ENV cors_whitelist=

EXPOSE 3200

CMD [ "node", "./bin/rest" ]