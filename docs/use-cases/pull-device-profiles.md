# Use Case - Pull Device Profiles

The Pull Device Profiles use case describes the steps that occur when
the system pulls all device profiles from a remote network.

## Success Scenario

* S: System

1. S: Fetch all device profiles from remote network, limited to 9,999
2. S: For all device profiles in parallel, [pull device profile](pull-device-profile.md)
3. S: Return an array of objects with references to the remote and local device profile IDs

### System fails to fetch a list of device profiles

1. S: Fails to fetch device profiles from remote network
2. S: Respond with error

### System fails to pull all device profiles

2. S: Fails to pull all device profiles successfully
3. S: Respond with failed pull error

## Issues

- Many networks don't support device profiles
