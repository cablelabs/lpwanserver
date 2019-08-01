# Use Case - Pull Device Profile

The Pull Device Profile use case describes the steps that occur when
the system pulls one device profile from a remote network.

## Success Scenario

* S: System

1. S: Load remote device profile
2. S: Find local DeviceProfile with the same name
3. S: Upsert ProtocolData for the remote device profile ID
4. S: Respond with local and remote device profile IDs

### System fails to load remote device profile

1. S: Fails to load remote device profile
2. S: Respond with error

### System fails to find local DeviceProfile with same name

2. S: Fails to find local DeviceProfile with the same name
3. S: Create DeviceProfile
4. Resume at step 3 in success scenario

#### System fails to create DeviceProfile

3. S: Fails to create DeviceProfile
4. S: Respond with error

### System fails to upsert ProtocolData

3. S: Fails to upsert ProtocolData for remote device profile ID.
4. S: Respond with error

## Issues

- Name shouldn't be used to match remote and local device profiles.
  See similar issue in [Pull Application](pull-application.md)
