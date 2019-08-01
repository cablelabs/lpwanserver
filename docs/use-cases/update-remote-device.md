# Use Case - Update Remote Device

The Update Remote Device use case describes the steps that occur when
the system updates one device on a remote network.

## Success Scenario

* S: System

1. S: Load Device
2. S: Find DeviceNetworkTypeLink
3. S: Load DeviceProfile
4. S: Find ProtocolData that contains remote device ID
5. S: Find ProtocolData that contains remote application ID
6. S: Find ProtocolData that contains remote device profile ID
7. S: Post request to remote network to update device

### System fails to load Device

1. S: Fails to load Device
2. S: Respond with error

### System fails to find DeviceNetworkTypeLink

2. S: Fails to find DeviceNetworkTypeLink
3. S: Respond with error

### System fails to load DeviceProfile

3. S: Fails to load DeviceProfile
4. S: Respond with error

### System fails to find ProtocolData for remote device ID

4. S: Fails to find ProtocolData for remote device ID
5. S: Respond with error

### System fails to find ProtocolData for remote application ID

5. S: Fails to find ProtocolData for remote application ID
6. S: Respond with error

### System fails to find ProtocolData for remote device profile ID

6. S: Fails to find ProtocolData for remote device profile ID
7. S: Respond with error

### System fails to update device on remote network

4. S: Fails to update remote device
5. S: Respond with error
