---
id: architecture
title: Architecture
sidebar_label: Architecture
---

The **LPWAN Server** is meant to be a flexible wrapper around the numerous IoT
data delivery networks.  To enable this flexibility, parts of the system
support a plug-in architecture that allows for future expansion.  In some cases,
these expansion areas correspond with others (e.g., UI support for entering
custom data for a network).

The Application Vendor uses the UI to interact with the system.  The UI uses
the REST API of the REST Server to access and update data.  The REST Server
then communicates with the remote network via the Internet.  The remote
networks pass data back, and the data is passed to the Reporting Protocols that
send the data back to the Application Vendor's server(s).

## Points of Customization

Note that there are four points of system customization:

- **Network Protocols** - Each remote network may have a unique API that the
  REST Server uses.  Some of these remote networks may also share APIs.  New
  Network Protocols can be added to support new APIs as new servers join the
  LPWAN Server ecosystem.

- **Reporting Protocols** - Application vendors will receive data from the REST
  Server.  The mechanism of sending what data can be customized on a per-application level.

- **Database Adapters** - LPWAN Server uses [Prisma](https://prisma.io) for the database layer.
  Prisma currently supports a few different databases, with many on the roadmap.
  LPWAN Server uses Postgresql as the default, but with simple modifications,
  LPWAN Server can be deployed with any database supported by Prisma.

- **UI Customizations** - UI customizations can be made so data specific to a
  network type can have a unique user interface.  For example, LoRa networks
  identify devices using an 8 byte binary value known as a DevEUI, where an
  NB-IoT network may use an IMEI, such as the one used by a mobile phone.  This
  data is known to and used by the Network Protocols and passed to the remote
  networks.  Currently deployed with the software:
  - **LoRa** - Specifies the data specific to the networks supporting the LoRa
    protocols.
  - **IP** - Supports a UI specific for IP-based devices.
  - **Default** - A general purpose data specification format, where data is
    specified in the expected internal JSON format for the network type.  This
    code is a last resort UI, for when the network-specific UIs are not
    available.  The Default UI should not be seen in a production system.

## The Data Model

The **LPWAN Server** data model is meant to be a general model that can
represent the data of many remote networks, while providing significant
customization for each type of network.  The following outlines the basic
elements of the system and how they interact:

### Public Data

- **Users** -  Usernames and passwords are used to log in to
  the system.  Users can be "Admin", which gives them global rights to
  access and modify records.  Normal users have the permissions needed
  to manage applications and devices.

- **Applications** - The functional grouping of Devices that all serve
  essentially the same purpose, reporting the data back to a remote server.
  Applications report the data collected from Devices to some network server
  using a ReportingProtocol.

- **Devices** - The devices that collect and report data back to the
  application.  Devices often communicate via a specific NetworkType, though
  multiple NetworkTypes could be supported if the Device has the necessary
  hardware.  Device settings are generally specified by a DeviceProfile.

- **DeviceProfiles** - A collection of settings for Devices for a particular
  NetworkType.  If a Device supports multiple NetworkTypes, each will use a
  different DeviceProfile.

- **Networks** - The remote networks that the LPWAN Server uses to configure and
  access data from Devices.  It has a NetworkType, which allows a Network to be queried
  for inclusion in actions on the NetworkType.  A Network specifies a NetworkProtocol,
  a base URL, and a version string.  The baseURL and version are used by the
  NetworkProtocol to communicate with the remote Network.  The Network also
  includes credentials that are used to validate access with the remote network.
  These values are encrypted by the system.

- **NetworkTypes** - A way of collecting Networks into a common data
  configuration scheme.  Network Types are essentially just names, but they
  are used to map Applications, Devices, and DeviceProfiles to the appropriate
  settings for deployment on a Network of that Network Type.  These settings are
  JSON objects called `networkSettings` inside of the ApplicationNetworkTypeLink,
  DeviceNetworkTypeLink, and DeviceProfile records.

- **NetworkProtocols** - The software that handles communicating with a remote
  network using its API.  A Network Protocol consists of a name and a pointer
  to the area of the code in which the Network Protocol handler is implemented.
  All handler methods receive the Network record, which contains the base URL
  and a version string.  In addition to exposing methods, Network Protocol handlers
  are EventEmitters, which allow them to emit events to the system.
  Network Protocols provision Applications, Devices, and Device Profiles to remote networks.
  They also configure application integrations and can possibly listen for device uplinks.

- **ReportingProtocols** - The software that sends collected device data to the
  server specified in the Application record via some defined API.  The system
  is designed to allow for the addition of new ReportingProtocols by adding the
  code to the system that supports the defined Javascript API and configuring
  the mapping of a name to that protocol via the ReportingProtocol table.

- **ApplicationNetworkTypeLinks** - Contains network settings of an Application for a
  particular Network Type.  It contains an enabled flag, which must be true for LPWAN Server
  to forward any communication to or from any device in that Application.
  The creation of an ApplicationNetworkTypeLink triggers
  the creation of one NetworkDeployment record for each Application-Network pair
  for that Network Type.

- **DeviceNetworkTypeLinks** - Contains network settings of a Device for a
  particular Network Type.  It contains an enabled flag, which must be true for LPWAN Server
  to forward any communication to or from that device.
  The creation of a DeviceNetworkTypeLink triggers
  the creation of one NetworkDeployment record for each Device-Network pair
  for that Network Type.

- **NetworkDeployment** - Represents the deployment of one record onto a remote network.
  It contains the remote ID, relevant meta, and a deployment status used by the system
  to determine whether or not to push the record to the remote network.  In the case
  of a failed deployment, the Network Deployment record contains an error log for
  recent failed deployment attemts.
