# Use Case - Push Device Profile

The Push Device Profile use case describes the steps that occur when
the system pushes one device profile to a remote network.

## Success Scenario

* S: System

1. S: Find ProtocolData that contains remote device profile ID
2. S: [Update remote device profile](update-remote-device-profile.md)
3. S: Respond with local and remote device profile IDs

### System fails to find ProtocolData

1. S: Fails to find ProtocolData that contains remote device profile ID
2. S: [Create remote device-profile](create-remote-device-profile.md)
3. Resume at step 3 in success scenario

#### System fails to create remote device profile

2. S: Fails to create remote device profile
3. Respond with error.

### System fails to update remote device profile

2. S: Fails to update remote device profile
3. S: Respond with error
