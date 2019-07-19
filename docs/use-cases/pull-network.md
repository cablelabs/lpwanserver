# Use Case - Pull Network

The Pull Network use case describes the steps that occur when
the system pulls a remote network. Pulling a network can be
initiated by the Actor via a REST call, or by the System as
part of creating a Network.

## Success Scenario

* A: Actor
* S: System

1. A: Post a request for pulling a network
2. S: Verify that the network is authorized (create-network entry)
3. [Pull applications](pull-applications.md) and [device profiles](pull-device-profiles.md) in parallel
4. [Pull devices](pull-devices.md) (create-network exit)
5. S: Respond with list of logs from networks.

### Network is not authorized

1. S: Fails to verify that Network is authorized
2. S: Respond with an error

### System fails to pull all applications and device profiles

2. S: Error occurs while pulling all applications and device profiles
3. S: Respond with error

### System fails to pull all devices

3. S: Error occurs while pulling devices
4. S: Respond with error

## Issues

- The logic for pulling a network doesn't attempt to authenticate with the network if
  it is not already authorized.
- The sequence of pulling a network varies according to the network.  For instance, on LoRa Server,
  a company is created on the remote network if it doesn't exist.  Also, for LoRa Server, device profiles
  are pulled, but other networks don't have the concept of device profiles.
- Network protocols should not create companies and users on the remote network.
- The NetworkProtocolAPI `networkProtocols.js` simply proxies the call to pull the network.
  The Network model should call the pullNetwork method on the protocol directly. Same with
  most methods on the NetworkProtocolAPI. Since sessions were moved to the protocol clients,
  NetworkProtolAPI mainly just proxies calls.
- The amount of successful asyncronous steps required to successfully pull a network is too big.
  There should be REST endpoints for pulling a device, an application (no devices), and all
  devices in an application. LPWAN shouldn't attempt to pull entire networks. Endpoints such as
  `/networks/:networkId/applications` and `/network/:networkId/applications/:applicationId/devices`
  could act as proxies to remote networks, providing the user with the info needed for more selective
  pulling.
- "Pull" doesn't have consistent meaning in LPWAN Server.  Pulling a network is inclusive of all apps
  and devices, but pulling all applications is separate from pulling all devices, and pulling
  all devices is separate from pulling device profiles.
