---
id: requirements
title: Requirements
sidebar_label: Requirements
---

## Docker and Docker-Compose

The development of LPWAN Server is largely based on
[Docker](https://docker.com).
Docker and Docker-Compose are required to run the [Getting Started guide](guides/gettings-started)
or run the LoRa Servers for development and testing.

### Install Docker

Please refer to the
[Get Started with Docker](https://www.docker.com/get-started)
guide to install Docker for MacOS or Windows. When installing Docker
on Linux, please refer to one of the following guides:

- [CentOS](https://docs.docker.com/install/linux/docker-ce/centos/#install-docker-ce)
- [Debian](https://docs.docker.com/install/linux/docker-ce/debian/)
- [Fedora](https://docs.docker.com/install/linux/docker-ce/fedora/)
- [Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/)

### Install Compose

To install Docker Compose on Linux, please refer to the
[Install Compose on Linux systems](https://docs.docker.com/compose/install/#install-compose)
guide. You can skip this step for MacOS and Windows.

## Git

```
$ apt install git
```

## Node.js

For development, the system should have Node v8.3.0 or higher and NPM v5.6.0 or higher.
We recommend installing Node.js and NPM through a version manager.
See the [NPM Docs page on Installation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
