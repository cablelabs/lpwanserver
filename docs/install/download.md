---
id: download
title: Download and Setup
sidebar_label: Download and Setup
---

The **LPWAN Server** project consists of 2 Git repositories.

## LPWAN Server

The LPWAN Server is written in Javascript using Node.js.  See the
[LPWAN Server Git repository](https://github.com/cablelabs/lpwanserver.git)
for more information.

Run these commands to download and install LPWAN Server.

```
$ git clone https://github.com/cablelabs/lpwanserver.git
$ cd lpwanserver
$ npm install
```

### Certificates

LPWAN Server must use TLS.  The repository contains a script for generating self-signed
certificates for running the LPWAN Server locally.  You will see a browser warning
when using the UI.  Click "advanced" and "proceed anyway" to get to the UI.  To avoid
seeing that message, you can also import `certs/ca-crt.pem` into your browser's certificates
management settings.

Run these commands to generate self-signed certificates for development.

```
mkdir certs
./bin/generate-development-certificates
```

## LPWAN Server Web Client

It is not necessary to clone the web client repository unless you are developing the LPWAN Server.
The docker image for LPWAN Server includes the UI application.
Skip this section if you are only evaluating LPWAN Server.

The web client is a [React](https://github.com/facebook/react) application.  See the
[web client Git repository](https://github.com/cablelabs/lpwanserver-web-client.git)
for more information.

Run these commands to download and install LPWAN Server web client.

```
$ git clone https://github.com/cablelabs/lpwanserver-web-client.git
$ cd lpwanserver-web-client
$ npm install
```

## Executable Scripts

Both the REST server and the web client have a `bin` directory with scripts to make certain
workflows more efficient.  If you encounter permissions errors in running the scripts, try
running these commands from the relavant repository.

```
$ sudo chown $USER bin/*
$ sudo chmod 755 bin/*
```
