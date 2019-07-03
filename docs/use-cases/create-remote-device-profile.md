# Use Case - Create Remote Device Profile

The Create Remote Device Profile use case describes the steps that occur when
the system creates one device profile on a remote network.

## Success Scenario

* S: System

1. S: Load Device Profile
2. S: Post request to remote network to create device profile
3. S: Upsert ProtocolData that contains remote device profile ID

### System fails to load DeviceProfile

1. S: Fails to load DeviceProfile
2. S: Respond with error

### System fails to create device profile on remote network

2. S: Fails to create remote device profile
3. S: Respond with error

### System fails to upsert ProtocolData for remote device profile ID

3. S: Fails to upsert ProtocolData for remote device profile ID
4. S: Respond with error
