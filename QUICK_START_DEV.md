# LPWAN Quick Start

This guide will lead you through installation and execution of LPWAN
working with LoRa Open Source servers configured as follows

* LoRa Server (self signed cert)
* LoRa App Server (self signed cert)
* LPWAN server (no cert)
* LPWAN front end app

## Development environment
The LPWAN development environment is based on [Docker](https://docs.docker.com/).
Ensure that you have docker and docker-compose installed before proceeding.
The docker daemon should also be running.

### Set script ownership and permissions

```
sudo chown $USER bin/*
sudo chmod 755 bin/*
```

### Initialize sqlite3 database

`./bin/init-db`

### Start development environment

`./bin/dev`

The docker-compose file `/dev/docker/docker-compose.yml` coordinates running all services, including
lpwanserver and the lpwanserver ui development server.  The lpwanserver and ui development server use
docker volumes so that code changes are reflected inside the container immediately.

The server is run with [nodemon](https://github.com/remy/nodemon).  Changing any file in the `rest`
folder will restart the server.

### Open the UI in a browser

Open `https://localhost:3000` in a browser.  You can login with these credentials.

```
username: admin
password: password
```

#### Test End to End Connections

Create a connection to the Lora Open Source Network
* Click the `Networks` link in the top navigation bar
* Click on the `CREATE` button next to the Lora Open Source entry
* Fill in the form as shown below, and hit `SUBMIT`
  - Network Name: **Lora NW**
  - Network Base URL: **https://localhost:8080/api**
  - Username: **admin**
  - Password: **admin**

Create a Company
* Click the `Companies` link in the top navigation bar
* Click on the `CREATE COMPANY` button
* Fill in the form as shown below, and hit `SUBMIT`
  - company name: **Fake Co**
  - Admin User Name: **fakeAdmin**
  - Password: **password**
  - Email: **fake@email.com**
  - Lora Enabled: **checked**
  - LoRaWAN Region: **US915**

If the company was succesfully created, this confirms that the app and all of the servers are communicating properly
