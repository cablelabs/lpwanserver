# Use Case - Push Device Profiles

The Push Device Profiles use case describes the steps that occur when
the system pushes all device profiles to a remote network.

## Success Scenario

* S: System

1. S: Fetch all local device profiles for the Network's NetworkType
2. S: For all device profiles in parallel, [push device profile](push-device-profile.md)

### System fails list local device profiles

1. S: Fails to list local applications
2. S: Respond with error

### System fails to push all device profiles

2. S: Fails to push all device profiles successfully
3. S: Respond with failed push error

## Issues

- System currently lists all local device profiles, instead of restricting
  them by the NetworkType.
