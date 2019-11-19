---
id: configuration
title: Configuration
sidebar_label: Configuration
---

## LPWAN Server

### Configuration Options

The configuration options for the REST server are specified in the `app/config`
folder.  The configuration parameters are documented as a JSON Schema in the
file `app/config/schema.json`.  Note that as new versions of this software are made available,
the administrator is expected to keep the configuration up-to-date.

You can make a file to hold a group of configuration settings.  See `development/config.json`.
Mount your config file into the docker container, and then use the `config_file` environment
variable to point to that file.  See the `docker-compose.yml` file for an example.

### Environment Variables

All top-level config settings can be overridden by an environment variable with the same name.

### File paths

All file paths in the configuration can be either absolute or relative to the app folder.
The app folder is located at `/usr/src/app` within the docker container.
If the first character is `/`, the path will be regarded as absolute.

### CORS

Part of the configuration setup includes
setting the CORS (Cross-Origin Resource Sharing) whitelist.  The whitelist
must allow access from the URL from which the UI is being served, as well as any
other applications using the REST Server.

### Security / TLS

LPWAN Server identifies IP devices via x.509 client certificates, so the Node.js server
must be configured with a TLS key/certificate pair.  Future versions may support terminating
the TLS connection at a reverse proxy if a convention can be established for passing
the client certificate from the proxy to the server.

To configure the LPWAN Server with your TLS key/certificate pair, choose a strategy for
making your TLS files available from within the docker container.  You could use a volume,
a bind mount, docker secrets, or some other method.  Then, point to those files via the
provided configuration settings.

#### Self-signed certificate

The [Download and Setup page](download)
has commands for generating self-signed certificates for development.

#### Let's Encrypt

[Let's Encrypt](https://letsencrypt.org/) is an option for getting free signed
certificates for your server.

For generating a certificate with [Let's Encrypt](https://letsencrypt.org/),
first follow the [getting started](https://letsencrypt.org/getting-started/)
instructions. When the `letsencrypt` cli tool has been installed, execute:

```bash
letsencrypt certonly --standalone -d DOMAINNAME.HERE
```

### Database

LPWAN Server uses [Prisma](https://prisma.io) for peristence.  Prisma sits in front
of the actual database, and uses connectors.  Using Prisma's documentation
as a guide, you can use any database supported by Prisma.  We use Postgresql.

The Prisma CLI has commands for seeding data from JSON or importing Normalized Data Format.

[Prisma docs on importing](https://www.prisma.io/docs/prisma-cli-and-configuration/data-import-and-export-jsw9/)

## Web Client

The LPWAN Server serves the default web client.  To disable this, set the `public_dir`
configuration variable to an empty string.

For build-time configuration of web-client assets, configuration options are in the `.env` file at the
root of `lpwanserver-web-client`.  These can be overridden by build-time environment variables.
