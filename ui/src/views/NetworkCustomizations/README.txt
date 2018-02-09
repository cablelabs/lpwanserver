Subdirectory names here must match the names in the networkTypes table
in order to support custom fields for the various data items we push down to
the remote networks.

Current files expected in each subdirectory:
- Company.js
- Applications.js
- Device.js

For example, The "LoRa" network type has files in
views/NetworkCustomizations/LoRa, and the Company create/edit pages load the
file views/NetworkCustomizations/LoRa/Company.js to handle the population of the
networkSettings field in the companyNetworkTypeLinks table for the LoRa network
type.

If the expected file is not available, a default UI is used that simply allows
the user to type in the required JSON data for the network type.
