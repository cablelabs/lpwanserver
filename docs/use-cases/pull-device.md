# Use Case - Pull Device

The Pull Device use case describes the steps that occur when
the system pulls one device from a remote network.

## Success Scenario

* S: System

1. S: Load remote device
2. S: Load local DeviceProfile
3. S: Find local Device with the same name
4. S: Find DeviceNetworkTypeLink
5. S: Upsert ProtocolData for the remote device ID
6. S: Respond with local Device ID

### System fails to load remote device

1. S: Fails to load remote device
2. S: Respond with error

### System fails to load remote device profile

2. S: Fails to load remote device profile
3. S: Respond with error

### System fails to find local Device with same name

2. S: Fails to find local Device with the same name
3. S: Create Device
4. Resume at step 4 in success scenario

#### System fails to create Device

3. S: Fails to create Device
4. S: Respond with error

### System fails to find DeviceNetworkTypeLink with same name

4. S: Fails to find DeviceNetworkTypeLink
5. S: Create DeviceNetworkTypeLink
6. Resume at step 5 in success scenario

#### System fails to create DeviceNetworkTypeLink

5. S: Fails to create DeviceNetworkTypeLink
6. S: Respond with error

### System fails to upsert ProtocolData

5. S: Fails to upsert ProtocolData for remote device ID.
6. Respond with error.

## Issues

- Name shouldn't be used to match remote and local device profiles.
  See similar issue in [Pull Application](pull-application.md)
