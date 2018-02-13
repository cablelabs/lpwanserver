This networkProtocols directory handles propagating data to the remote networks
from the LPWAN Server.  The LPWAN Server code uses the networkTypeApi.js
library to pass data off to each network in the type.  The networkProtocols.js
code calls into the code for each network, linked to the appropriate
networkProtocol, and passing in an instance of networkProtocolDataAccess.js
which enables the networkProtocol code to access the local data, save logging
(since the networkProtocols are all called asynchronously), and more.

To extend to a new networkProtocol, copy the file protocoltemplate.js to a new
file named for the protocol, and implement the methods there.  LoRaOpenSource.js
may be a good example to follow.

A note about devices vs. deviceProfiles:  DeviceProfiles are intended to
represent the settings that many devices may use on a network, allowing the user
to simply link to these settings when provisioning a new device.  Some protocols
(e.g., LoRaOpenSource) support a concept of deviceProtocols directly.  Others
will require that the deviceProfiles be read and passed along with each device.
This also causes complications when a deviceProfile is updated; all of the
devices must then be updated manually by the networkProtocol code.

Once the code is complete, you can use a global admin account in the UI to add
the new networkProtocol to the system for use by networks.
