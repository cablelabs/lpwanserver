---
id: overview
title: LPWAN Server Points of Extension
sidebar_label: Overview
---

The **LPWAN Server** is intended to be an extensible framework, allowing for
the addition of the following areas:

- **Reporting Protocols** - Code that takes raw data from a remote network and
  sends it to an application via some predefined communications model.

- **Network Integrations** - IoT networks will come and go.  The Network
  Integration allows the basic central code in **LPWAN Server** to remain
  consistent and stable, while providing the flexibility to add new networks.
  Network Integrations are achieved via the following customizations:

  - **Network Types** - Definitions of IoT protocols.  One of these definitions
    implies a set of data that any number of IoT networks would be able to
    use to configure the Applications and Devices for their own network.

  - **UI Customizations** - Code that can be plugged into the UI to allow
    for controlled data entry for the data for a particular Network Type.

  - **Network Protocols** - The code that can take a Network Type data model
    and use that data to manage the Applications and Devices on a remote
    network with a specific API.

Ultimately, a Network Type matches UI Customization code to a set of Network
Protocols that communicate with a remote network API, using the data of a
specific Network Type.

## Network Protocol Extensions

A Network Protocol is the code that takes the data of a given Network Type and
passes it to a remote network with a given API.  The point is to have that
remote network behave as if the data had been entered on that system directly.

Network Protocol Extensions can be found and added in the rest/networkProtocols/handlers
directory off of the repository's root directory.

All Network Protocols extend provided JavaScript classes in order to share
business logic.  A Network Protocol should extend the class in the file
networkProtcols/NetworkProtcol.js.  From there, you can use additional inheritence
for Network Types, versions, etc.  The path to the new Network Protocol also
needs to be added to the array at the top of networkProtocols/networkProtocols.js.
Network Protocols are registered asynchronously, but in a sequential sequence,
so one registration doesn't start until the completion of the previous registration.

Many Network Protcol methods receive an object referred to as `dataAPI`.  This is defined
in networkProtocolDataAccess.js, and is intended to be the means by which
Network Protocols access LPWAN Server models.

## Reporting Protocol Extensions

A Reporting Protocol is the code that receives data from a remote network and
passes it off to the Application based on the entered URL.

Network Protocol Extensions can be found and added in the rest/reportingProtocols
directory off of the repository's root directory.

All Reporting Protocols implement the same API to be used by the LPWAL Server.
This API is found in the protocolhandlertemplate.js file, which should be copied
to the file that is to serve as the Network Protocol handler.  When configuring
a new Reporting Protocol via the UI, you need only specify the file name (not the
directory path) for this new file.  Please see the README.txt in this same
directory for additional information.
