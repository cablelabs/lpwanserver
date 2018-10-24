# LPWAN Quick Start

This guide will lead you through installation and execution of LPWAN
working with LoRa Server servers configured as follows

* LoRa Server (self signed cert)
* LoRa App Server (self signed cert)
* LPWAN server (no cert)
* LPWAN front end app

For installation and configuration deatils can be found on these pages

* [LPWAN Instllation Guide](https://lpwanserver.com/install/)
* [LoRa Server Instllation Guide](https://www.loraserver.io/overview/)

## Lora Server Installation

#### Install LoRa Dependencies
```bash
sudo apt install mosquitto mosquitto-clients redis-server redis-tools postgresql
```

#### Add LoRa Server to your apt repo list
```bash
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 1CE2AFD36DBCCA00
sudo echo "deb https://artifacts.loraserver.io/packages/1.x/deb stable main" | \
sudo tee /etc/apt/sources.list.d/loraserver.list
sudo apt update
```

#### Set up the LoRa Server and LoRa App Server Databases
```bash
# Start postgress command terminal
sudo -u postgres psql

# Enter these postgres commands
create role loraserver_as with login password 'dbpassword';
create role loraserver_ns with login password 'dbpassword';
create database loraserver_as with owner loraserver_as;
create database loraserver_ns with owner loraserver_ns;
\c loraserver_as;
create extension pg_trgm;
\q
```

#### Install Lora Server
```bash
sudo apt install loraserver
```

#### Configure The Lora Server
```bash
sudo vi /etc/loraserver/loraserver.toml
```

_Change these settings in the .toml file_
```
[network_server]      # set net_id to desired value
net_id="ABCDEF"

[network_server.band] # set to US_902_928
name="US_902_928"

[postgresql]
dsn="postgres://loraserver_ns:dbpassword@localhost/loraserver_ns?sslmode=disable"
```

## Lora App Server Installation
```bash
sudo apt install lora-app-server
```

#### Configure The Lora Server
```bash
sudo vi /etc/lora-app-server/lora-app-server.toml
```

_Change these settings in the .toml file_
```bash
[application_server.external_api]
jwt_secret="ugWV5GwVrc8kcoVNm1iZP2po25GHBXcaKpoj8Kc7W/4="

[postgresql
dsn="postgres://loraserver_as:dbpassword@localhost/loraserver_as?sslmode=disable"
```

## Running the LoRa Servers

#### Start and monitor the servers (seperate terminal for each)
```bash
# Lora Server
sudo systemctl start loraserver; sudo journalctl -u loraserver -f

# Lora App Server
sudo systemctl start lora-app-server; sudo journalctl -u lora-app-server  -f

# Note: to stop the servers
sudo systemctl stop loraserver
sudo systemctl stop lora-app-server
```

#### Link Lora App Server to Lora Server

Note: As configured, the LoRa App Server is using a self signed certificate.  When you start the application, your browser may issue a security warning.  If this happens, tell the browser to continue to the page.  For example in chrome on the warning page you would do the following

* Click the `ADVANCED` button
* Click `Proceed to localhost (unsafe)` link


_Start Lora App Server in a browser_
```
https://localhost:8080
username: admin
password: admin
```

In the application itself

* Click the `Network Servers` link in the top navigation bar, then the `ADD NETWORK SERVER` button.
* Fill in the form as shown below, and hit `SUBMIT`
  - Network-server name: **my-loraserver**
  - Network-server server: **localhost:8000**

## LPWAN Server Installation

#### Install LPWAN Dependencies
```bash
sudo apt install git sqlite3
wget https://deb.nodesource.com/setup_9.x
chmod 755 setup_9.x
sudo ./setup_9.x
sudo apt install nodejs
rm ./setup_9.x
```


#### Install LPWAN
```bash
git clone https://github.com/cablelabs/lpwanserver.git
cd lpwanserver
npm install
cd ui
npm install
cd ..
```

#### Create initial LPWAN database
```bash
sqlite3 data/lpwanserver.sqlite3 < data/lpwanserver.2.2.generateSchema.sql
sqlite3 data/lpwanserver.sqlite3 < data/lpwanserver.2.2.initializeData.sql
```

### Run the LPWAN Server

Note: LPWAN server is configured via the file `config.hjson.[NODE_ENV]`, where NODE_ENV is an enviornment variable.  As run shown below, the configuration file used by the lpwan server will be `config.hjson.local`
```bash
chmod +x ./bin/rest
NODE_ENV=local ./bin/rest
```

#### Configure and run the UI server
```bash
# In a seperate terminal
cd ui
vi .env
  # Make sure to set the server URL as follows (note http, not https)
  REACT_APP_REST_SERVER_URL=http://localhost:3200
npm start
```

```
# In a browser
https://localhost:3000 # you should already be here after npm start
username: admin
password: password
```

#### Test End to End Connections

Create a connection to the LoRa Server Network
* Click the `Networks` link in the top navigation bar
* Click on the `CREATE` button next to the LoRa Server entry
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
