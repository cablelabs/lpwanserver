The NetworkCustomizations directory has code that provides UI elements for
the various network types supported by the LPWAN Server.

Subdirectory names here must match the names of the networkTypes records
in order to support custom fields for the various data items we push down to
the remote networks.

Current files expected in each subdirectory:
- Company.js
  - For the given networkType, handles the management of the
    companyNetworkTypeLinks record for that networkType.  The UI is used to
    populate the networkSettings field of that record.
- Applications.js
  - For the given networkType, handles the management of the
    applicationNetworkTypeLinks record for that networkType.  The UI is used to
    populate the networkSettings field of that record.
- Device.js
  - For the given networkType, handles the management of the
    deviceNetworkTypeLinks record for that networkType.  The UI is used to
    populate the networkSettings field of that record.  Note that settings that
    may make sense for many devices should probably be put into the
    DeviceProfile records.
- DeviceProfile.js
  - Note that deviceProfiles are a little different than the previous UI
    elements.  DeviceProfiles support a single networkType, and are referenced
    by the deviceNetworkTypeLinks.  Therefore the record handling logic is
    different, so don't be thrown.
- Network.js
  - Networks are also different.  Like deviceProfiles, the data from this UI is
    not saved in a separate record from the networks record.  Also note that
    since this data is the most likely place to store credentials to access the
    remote network, the field is encrypted in the database.

For example, The "LoRa" network type has files in
views/NetworkCustomizations/LoRa, and the Company create/edit pages load the
file views/NetworkCustomizations/LoRa/Company.js to handle the population of the
networkSettings field in the companyNetworkTypeLinks table for the LoRa network
type.

If the expected file is not available, a default UI is used that simply allows
the user to type in the required JSON data for the network type.

To add UI code for a new network type, copy over the default directory under the
new networkType's name, and modify the files to support the expected data for
that networkType.

Please note: Even though not all networkType UI code is visible, it is all put
onto the form that the user sees.  This has a side-effect that if a field is
invalid on a hidden form, the form will appear to become unresponsive to the
"Submit" button.  Therefore, all UI fields must be initialized with valid
default data.

Also note: The fields created by these UI elements are expected to be used by
the networkProtocol code for the remote networks.  Therefore, changes and
additions here should be matched in the networkProtocols code in the REST
server.
