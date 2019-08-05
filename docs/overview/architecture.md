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

- **Users** -  Usernames and passwords to log in to
  the system.  Users can be "Admin", which gives them global rights to
  access and modify records.  Normal users have permission to access
  and modify data that they've created.

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
  access data from Devices.  A Network has a base URL for communications with
  the Network, a NetworkType, basically defining the data that is relevant to
  the Network, and a NetworkProtocol that defines the API used to communicate
  with the Network.  In addition, the Network includes data that is used to
  validate access with the remote network, which is defined by the NetworkType.

- **NetworkTypes** - A way of collecting Networks into a common data
  configuration scheme.  When provisioning Applications, Devices, or
  DeviceProfiles via the UI, the NetworkType selection enables custom UI
  elements that allow for providing this data.  To allow the database to
  store this potential varying data, it is placed into the record as a JSON
  object string.  When communicating with the REST interface, this data can be
  found in the Network, ApplicationNetworkTypeLink,
  DeviceNetworkTypeLink and DeviceProfile records.  It is left to the caller of
  the REST API to provide the data expected for each NetworkType.  This data is
  consumed by the NetworkProtocol for a Network to provision the remote network.

- **NetworkProtocols** - The software that handles communicating with a remote
  network using its API.  A NetworkProtocol is coded to take the data defined
  by a particular NetworkType, and pass that data and other local data to the
  remote network in order to configure that network's companies (optional),
  applications, and devices.  The system is designed to allow for the addition
  of new NetworkProtocols by adding the code to the system that supports the
  defined Javascript API and configuring the mapping of a name to that protocol
  via the NetworkProtocol table.

- **ReportingProtocols** - The software that sends collected device data to the
  server specified in the Application record via some defined API.  The system
  is designed to allow for the addition of new ReportingProtocols by adding the
  code to the system that supports the defined Javascript API and configuring
  the mapping of a name to that protocol via the ReportingProtocol table.

- **ApplicationNetworkTypeLinks** - Links basic application data defined in
  Applications to a specific NetworkType, and includes the custom data for that
  NetworkType.  Creation of an ApplicationNetworkTypeLink causes the system to
  call the NetworkProtocol for the remote networks of that type, provisioning
  the application data on the remote system.

- **DeviceNetworkTypeLinks** - Links basic device data defined in Devices to a
  specific NetworkType, and includes the custom data for that NetworkType.
  Creation of a DeviceNetworkTypeLink causes the system to call the
  NetworkProtocol for the remote networks of that type, provisioning the device
  data on the remote system.
