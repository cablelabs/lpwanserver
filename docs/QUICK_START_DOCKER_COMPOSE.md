## Quickstart using Docker-Compose

[Docker Compose][1] (part of Docker) makes it possible to orchestrate the configuration of multiple Docker containers at once using a docker-compose.yml file.

### Requirements

#### Install Docker

Please refer to the [Get Started with Docker][2] guide to install Docker for MacOS or Windows. When installing Docker on Linux, please refer to one of the following guides:

- [CentOS][3]
- [Debian][4]
- [Fedora][5]
- [Ubuntu][6]

#### Install Compose

To install Docker Compose on Linux, please refer to the [Install Compose on Linux systems][7] guide. You can skip this step for MacOS and Windows.

### LPWAN Server

#### Configure

The LPWAN Server project provides an example docker-compose.yml file that you can use as a starting-point. This example can be found at https://github.com/cablelabs/lpwanserver/docker/docker-compose.yml.

To clone this repository, you need to execute the following commands:

```
$ git clone https://github.com/cablelabs/lpwanserver.git
$ cd lpwanserver
```

#### Start

After you have updated the configuration, you can run the following command to start all Docker containers:

```
$ docker-compose -f docker/docker-compose.yml up
```

The above command starts the LPWAN Server and it's UI.  If you would like to run [LoRa Server][8] locally,
use the following command:

```
$ docker-compose -f docker/docker-compose.loraserver.yml -f docker/docker-compose.yml up
```

**URLs**
- LPWAN Server - http://localhost:3200
- LPWAN Server UI - http://localhost:3000
- LoRa Server - https://localhost:8080
- LoRa Server V1 - https://localhost:8081

### Test End to End Connections

#### Create a connection to the LoRa Server Network

These instructions assume you're running LoRa Server in docker, using `docker-compose.loraserver.yml`.

* Click the `Networks` link in the top navigation bar
* Click on the `CREATE` button next to the LoRa Server entry
* Fill in the form as shown below, and hit `SUBMIT`
  - Network Name: **Lora NW**
  - Network Base URL: **https://lora_appserver:8080/api**
  - Username: **admin**
  - Password: **admin**

If the network was succesfully created, this confirms that LPWAN Server and LoRa Server and communicating correctly.

[1]: https://docs.docker.com/compose/
[2]: https://www.docker.com/get-started
[3]: https://docs.docker.com/install/linux/docker-ce/centos/#install-docker-ce
[4]: https://docs.docker.com/install/linux/docker-ce/debian/
[5]: https://docs.docker.com/install/linux/docker-ce/fedora/
[6]: https://docs.docker.com/install/linux/docker-ce/ubuntu/
[7]: https://docs.docker.com/compose/install/#install-compose
[8]: https://www.loraserver.io/