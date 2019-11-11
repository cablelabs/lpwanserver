# Use Case - Multi-Type Devices

The Multi-Type devices use case describes a sequence of plausable
steps the might occur when managing a single model device that
supports multiple network types (like dual radio devices).

**Network Types**
* IP
* LoRa, ChirpStack v2

## Steps

* A: Actor, User with role "USER"
* S: System

1. [Authenticate](authenticate.md)
2. [Create ChirpStack v2 network](create-network.md)
3. A: Add IP device profile
4. A: Add LoRa device profile
5. A: Create application
6. A: Create IP ApplicationNetworkTypeLink
7. A: Create LoRa ApplicationNetworkTypeLink
8. A: Confirm Application is on ChirpStack network.
9. A: Create Device
10. A: Create IP DeviceNetworkTypeLink
11. A: Create LoRa DeviceNetworkTypeLink
12: A: Confirm Device and DeviceProfile are on ChirpStack network
13: A: Send an uplink from each device
14: A: Verify application server received uplinks
15: A: Send a downlink to devices
16: A: Verify downlink received by IP device.
17: A: Verify downlink was received by ChirpStack network.
18: A: Delete LoRa DeviceNetworkTypeLink
19: A: Send a downlink to devices
20: A: Confirm msg not received by ChirpStack network.
21: A: Send an uplink from ChirpStack network.
22: A: Confirm msg doesn't reach application server.

## Issues

- NetworkProtocols should declare requirements for downlinks.  LPWAN should
  validate the downlink with all NetworkProtocols before attempting to send
  the message to any.
