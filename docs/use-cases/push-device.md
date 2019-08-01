# Use Case - Push Device

The Push Device use case describes the steps that occur when
the system pushes one device to a remote network.

## Success Scenario

* S: System

1. S: Find ProtocolData that contains remote device ID
2. S: [Update remote device](update-remote-device.md)
3. S: Respond with local and remote device IDs

### System fails to find ProtocolData

1. S: Fails to find ProtocolData that contains remote app ID
2. S: [Create remote device](create-remote-device.md)
3. Resume at step 3 in success scenario

#### System fails to create remote device

2. S: Fails to create remote device
3. Respond with error.

### System fails to update remote device

2. S: Fails to update remote device
3. S: Respond with error
