# Use Case - Push Devices

The Push Devices use case describes the steps that occur when
the system pushes all devices to a remote network.

## Success Scenario

* S: System

1. S: Fetch all local devices
2. S: For all devices in parallel, [push device](push-device.md)

### System fails list local Devices

1. S: Fails to list local Devices
2. S: Respond with error

### System fails to push all devices

2. S: Fails to push all devices successfully
3. S: Respond with failed push error

## Issues

- Failure to push any device will halt operation.
- If an error occurs, the user doesn't receive feedback as to which
  devices were pushed.  Process should use a
  [reflect abstraction](https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises)
  to prevent Promise.all from rejecting.
- Query for local Devices should instead be a query for DeviceNetworkTypeLinks for Network's
  NetworkType.  Get the device IDs from the DeviceNetworkTypeLinks, and push only those.
- Pushed devices should be batched by application.
