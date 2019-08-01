# Use Case - Update Remote Device Profile

The Update Remote Device Profile use case describes the steps that occur when
the system updates one device profile on a remote network.

## Success Scenario

* S: System

1. S: Load Device Profile
2. S: Find ProtocolData that contains remote device profile ID
3. S: Post request to remote network to update device profile

### System fails to load DeviceProfile

1. S: Fails to load DeviceProfile
2. S: Respond with error

### System fails to find ProtocolData for remote device profile ID

2. S: Fails to find ProtocolData for remote device profile ID
3. S: Respond with error

### System fails to update device profile on remote network

3. S: Fails to update remote device profile
4. S: Respond with error
