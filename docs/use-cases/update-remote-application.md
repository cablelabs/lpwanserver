# Use Case - Update Remote Application

The Update Remote Application use case describes the steps that occur when
the system updates one application on a remote network.

## Success Scenario

* S: System

1. S: Load Application
2. S: Find ProtocolData that contains remote application ID
3. S: Find ApplicationNetworkTypeLink
4. S: Post request to remote network to update application

### System fails to load Application

1. S: Fails to load Application
2. S: Respond with error

### System fails to find ProtocolData for remote application ID

2. S: Fails to find ProtocolData for remote application ID
3. S: Respond with error

### System fails to find ApplicationNetworkTypeLink

3. S: Fails to find ApplicationNetworkTypeLink
4. S: Respond with error

### System fails to update application on remote network

4. S: Fails to update remote application
5. S: Respond with error
