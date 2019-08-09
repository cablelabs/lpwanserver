---
id: deployment
title: Deployment
sidebar_label: Deployment
---

## Deployment

A public docker image exists for
[LPWAN Server](https://hub.docker.com/r/lpwanserver/lpwanserver/).
The easiest way to deploy LPWAN Server is to use a container management tool, like
[Docker Machine](https://docs.docker.com/machine/overview/). LPWAN Server provides
[an example docker-compose file](https://github.com/cablelabs/lpwanserver/blob/master/docker/docker-compose.yml).

### Database

LPWAN Server depends on a running instance of
[Prisma](https://prisma.io) to which the provided Datamodel has been deployed.
The datamodel is at `prisma/versions/v{n}`.
Prisma provides a Docker image, so you can run Prisma
alongside LPWAN Server.  Prisma gets configured with the details
of Postgresql.  You can choose to run Postgres via the public
Postgres Docker image or by using a hosted Postgres service.

#### Setup Postgresql

Setup an uninitialized Postgres service.

#### Setup Prisma

Make a folder inside the repo at `prisma/prod` to hold your production `prisma.yml` file.
Create or update a running Prisma instance to be able to connect to your Postgres instance.
Here are some documentation pages.

- [Prisma Server](https://www.prisma.io/docs/prisma-server/)

Make sure to setup Authentication by following the docs.

From within your production `prisma.yml` file, point to the latest version
of the Datamodel.

#### Deploy Prisma

Use Prisma's CLI to deploy the provided datamodel to the Prisma service that you created
for LPWAN Server.

#### Redis

LPWAN Server uses Redis for PubSub and DB caching.

#### Configure LPWAN Server to connect to Prisma and Redis

Set these environment variables when running LPWAN Server.

- **prisma_url** - url to your Prisma service
- **redis_url** - url to your Redis service

### LPWAN Server

[Docker Image](https://hub.docker.com/r/lpwanserver/lpwanserver/)

Refer to the
[configuration page](configuration)
for information on configuring the LPWAN Server.

### Web Client Assets

If you want to serve the web-client from a CDN, object storage platform, or
any other server than the one provided in the Web Client docker image, the
[build page](build)
shows you how to configure the Web Client with the LPWAN Server location
and build the app assets.  Also set LPWAN Server's `public_dir` setting
to an empty string when deploying LPWAN Server.
