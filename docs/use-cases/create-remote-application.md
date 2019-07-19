# Use Case - Create Remote Application

The Create Remote Application use case describes the steps that occur when
the system creates one application on a remote network.

## Success Scenario

* S: System

1. S: Load Application
2. S: Find ApplicationNetworkTypeLink
3. S: Post request to remote network to create application
4. S: Upsert ProtocolData that contains remote application ID

### System fails to load Application

1. S: Fails to load Application
2. S: Respond with error

### System fails to find ApplicationNetworkTypeLink

2. S: Fails to find ApplicationNetworkTypeLink
3. S: Respond with error

### System fails to create application on remote network

3. S: Fails to create remote application
4. S: Respond with error

### System fails to upsert ProtocolData for remote application ID

4. S: Fails to upsert ProtocolData for remote application ID
5. S: Respond with error
