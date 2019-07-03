# Use Case - Push Application

The Push Application use case describes the steps that occur when
the system pushes one application to a remote network. This doesn't
include pushing devices.

## Success Scenario

* S: System

1. S: Find ProtocolData that contains remote application ID
2. S: [Update remote application](update-remote-application.md)
3. S: Respond with local and remote app IDs

### System fails to find ProtocolData

1. S: Fails to find ProtocolData that contains remote app ID
2. S: [Create remote application](create-remote-application.md)
3. Resume at step 3 in success scenario

#### System fails to create remote application

2. S: Fails to create remote application
3. Respond with error.

### System fails to update remote application

2. S: Fails to update remote application
3. S: Respond with error
