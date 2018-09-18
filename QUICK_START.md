# LPWAN Quick Start

This guide will lead you through installation and execution of LPWAN
working with LoRa Open Source servers configured as follows

* LoRa Server (self signed cert)
* LoRa App Server (self signed cert)
* LPWAN server (no cert)
* LPWAN front end app

## Development environment

### System software requirements

The LPWAN development environment is based on Docker and Node.

- [Docker (and Docker Compose)](https://docs.docker.com)
- [Node (and npm)](https://nodejs.org)

### Set script ownership and permissions

```
sudo chown $USER bin/*
sudo chmod 755 bin/*
```

### Initialize sqlite3 database

`./bin/init-db`

### Build UI server image

Clone the [web-client](https://github.com/cablelabs/lpwanserver-web-client) repo
and follow the README instructions to build a docker image to serve the UI. (build && package)

### Start development environment

Run `./bin/dev`.
The docker-compose file `/dev/docker/docker-compose.yml` coordinates running the lpwanserver
and all service dependencies.

The UI is available at `https://localhost:3000`.
LPWAN Server is available at `https://localhost:3200`

### Open the UI in a browser

Open `https://localhost:3000` in a browser.  You can login with these credentials.

```
username: admin
password: password
```

### Test End to End Connections

#### Create a connection to the Lora Open Source Network
* Click the `Networks` link in the top navigation bar
* Click on the `CREATE` button next to the Lora Open Source entry
* Fill in the form as shown below, and hit `SUBMIT`
  - Network Name: **Lora NW**
  - Network Base URL: **https://appserver:8080/api**
  - Username: **admin**
  - Password: **admin**
* **lora_appserver** in the URL comes from the service name in `/docker/dev/docker-compose.yml`
* Use the port exposed by the docker image (8080), not the port on localhost.  So use 8080 for both Lora app servers.

#### Create a Company
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
