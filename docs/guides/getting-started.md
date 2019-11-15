---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

In this guide, we'll start an instance of LPWAN Server, along with a Postgresql
database.  We'll also run an instance of [ChirpStack](https://www.chirpstack.io).
We'll add the instance of ChirpStack within the LPWAN Server web-client UI,
which will cause the applications and devices to be pulled.

This guide involves running multiple services.  We'll use
[Docker Compose](https://docs.docker.com/compose/) to run the databases
and services.

## Setup

Docker, Docker Compose, and Node.js are required to run LPWAN Server
according to this guide.

Refer to the [Requirements page](install/requirements)
for instructions on how to install these tools.

Refer to the [Download and Setup page](/install/download)
for instructions on downloading and installing LPWAN Server.

## Demo

The sequence of steps involved for starting and stopping the services are sequenced
in a bash script at `/bin/demo` within the LPWAN Server repo.  You can view these
files to find out more about what commands and configurations are involved in
running the demo.

- `/bin/demo`
- `/development/databases/docker-compose.demo-db.yml`
- `/development/chirpstack/docker-compose.yml`
- `/docker-compose.demo.yml`

## Start Demo

The LPWAN Server is setup with a "demo" script to start the server and accompanying services.
Running the demo is the easiest way to try out LPWAN Server.

```
# Start demo
./bin/demo

# Stop demo
./bin/demo stop
```

### URLs

- LPWAN Server REST API - https://localhost:3200/api
- LPWAN Server Web Client - https://localhost:3200
- ChirpStack App Server - https://localhost:8082
- ChirpStack App Server V1 - https://localhost:8081

## Use Demo

### Login

Use these credentials to log in.

- **username** - `admin`
- **password** - `password`

### Create a connection to the ChirpStack Network

* Click the `Networks` link in the top navigation bar
* Click on the `CREATE` button next to the LoRa Server entry
* Fill in the form as shown below, and hit `SUBMIT`
  - Network Name: **Lora NW**
  - Network Base URL: **http://chirpstack_app_svr:8080/api**
  - Username: **admin**
  - Password: **admin**

If the network was succesfully created, this confirms that LPWAN Server and ChirpStack are communicating correctly.

### View Application

If you navigate to the home page, you will see an application that was pulled from the ChirpStack network.
