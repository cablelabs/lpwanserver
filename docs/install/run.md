---
id: run
title: Running LPWAN Server for Development
sidebar_label: Run
---

Developing LPWAN Server involves running other services along with LPWAN Server.
Development is based on Docker.  There are docker-compose files for each
group of services that need to run, and they're set up to network
with each other.

## Prisma, Postgresql, and Redis
All persistence services are contained in one docker-compose file.  These are used
by LPWAN Server and the ChirpStack instance used in development.
There is a script for making it easier to start and stop persistence services.

Before starting the LPWAN Server for development, you must first start the database
and then deploy the models.  The `deploy` command, listed below, generates the database
client, which is required by the LPWAN server.

```
# Start all persistence services
$ ./development/bin/manage-db start

# Deploy the data models to Prisma
$ ./development/bin/manage-db deploy

# Stop all persistence services
$ ./development/bin/manage-db stop

# Reset the database to the base set of seeded records contained in `prisma/verions/v{x}`
$ ./development/bin/manage-db reset
```

Prisma runs a GraphQL Playground at `http://localhost:4466` that allows you
to query and mutate the database.  You can also deploy it with a setting that enables
a UI dashboard to the data.

## ChirpStack

Run this command to start versions 1 and 2 of ChirpStack and ChirpStack App Server.

```
$ docker-compose -f development/loraserver/docker-compose.yml up
```

ChirpStack App Servers are at:

- `https://localhost:8081` (v1)
- `https://localhost:8082` (v2)

## LPWAN Server

Run this command to start LPWAN Server for development.

```
$ docker-compose -f development/docker-compose.yml up --build
```

LPWAN Server is run with `nodemon` inside of a docker container.  Any
changes within the `rest` folder will cause the server to restart.
Any changes outside of the rest folder will require restarting the container.

The LPWAN Server REST API is at `https://localhost:3200/api`.

## Web Client

If you're developing the server and you need the UI, run this command from within
the lpwanserver-web-client repo to start the web client for development.

```
$ npm run dev
```

The web-client is at `http://localhost:3000`.

[Webpack Development Server](https://github.com/webpack/webpack-dev-server)
will update the browser on changes to the web-client source code.

## Docker Networking

The services network through Docker, so when adding a ChripStack network in LPWAN Server,
you need to use the internal URL as the baseUrl.

- `https://lora_appserver1:8080/api` (v1)
- `https://lora_appserver:8080/api` (v2)
