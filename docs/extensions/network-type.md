---
id: network-type
title: Network Type Extensions
sidebar_label: Network Type Extensions
---

Network Types seem very easy to add.  Go into the UI as a System Administrator,
select the *Network/Network Types* menu item from the top menu, click the *Create Network Type* button, and give it a name.  That's it, right?

No, not at all.

A Network Type's name does little good on its own.  The strength of the Network
Type is in its mapping of a set of data to the Network Protocols that would use
that set of data.

On this page, we will discuss the UI aspect of adding a new Network Type.  See
[Network Protocols](/extensions/networkprotocols) on the details of how to add
a new Network Protocol.  We separate that topic out because while you could add
a Network Protocol without a new Network Type (e.g., a new protocol for an
existing Network Type to a new server API, or even a new sever API version),
creating a new Network Type without a Network Protocol to use it is of no use
to the system.

## Network Type UI Customization

Data for a Network Type gets stored in the following LPWAN Server database
records:

- **Networks** - Intended to keep any data used to access the remote network.
  This could range from username/password credentials to stored JWT tokens or
  more. (This data is encrypted by the server.)  The data is saved in the
  securityData field of the record in a JSON structure.  This record implies
  the existence of a remote network API server at the baseURL in the main data
  of the record.

- **ApplicationNetworkTypeLinks** - Intended to keep the data required for an
  application on the remote networks of the type.  The Network Type-specific
  data is kept in the networkSettings field of the database record in a JSON
  structure.  Existence of this record implies the existence of the application
  on the remote networks of the type.

- **DeviceNetworkTypeLinks** - Intended to keep the data required for a device
  on the remote networks of the type.  The Network Type-specific data is kept
  in the networkSettings field of the database record in a JSON structure.
  Existence of this record implies the existence of the device on the remote
  networks of the type.  Note that these device records reference Device
  Profiles.

- **DeviceProfiles** - Intended to consolidate device configuration settings for
  a Network Type so they do not need to be reentered for each device of the same
  manufacture.  A deviceNetworkTypeLink will point to a deviceProfile.  Some
  remote network APIs may or may not support the concept, but that is left to
  the implementor of the Network Protocol.  The Network Type-specific data is
  kept in the networkSettings field of the database record in a JSON
  structure.

The UI for these records appears on the screens for the more general data
entry.  For example, at the bottom of the Application data entry screens, there
is a list of available Network Types for the application.  Clicking the
checkbox controls the creation of the applicationNetworkTypeLinks record for
that Network Type, and exposes (or hides) the custom UI for that type.  That UI
code is responsible for populating the networkSettings field with the data
required for an Application of that Network Type.

In order to add the UI Customization for a Network Type, React UI code is
written and added to the codebase.  Within the LPWAN Server UI source code,
there is a directory `ui/src/views/NetworkCustomizations`.  Within that
directory, there is a `README.txt` file that explains the extension process in
detail.  However, the general idea is that for each Network Type, there is a
subdirectory of the same name as the Network Type which contains the React UI
code for each data type mentioned above: network.js, company.js, application.js,
device.js, and deviceProfile.js.

Note that later changes to the Customized UI code that alter, add, or remove
data will likely require changes to the Network Protocols code in the REST
Server.
