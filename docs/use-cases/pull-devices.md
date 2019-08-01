# Use Case - Pull Devices

The Pull Devices use case describes the steps that occur when
the system pulls all devices from a remote network.

## Success Scenario

* S: System

1. S: Fetch all devices from remote network, limited to 9,999
2. S: For all devices in parallel, [pull device](pull-device.md)
3. S: Return an array of local Device IDs

### System fails to fetch a list of devices

1. S: Fails to fetch devices from remote network.
2. S: Respond with error

### System fails to pull all devices

2. S: Fails to pull all device profiles successfully
3. S: Respond with failed pull error

## Issues

- Devices should be pulled by application, not all at once.
