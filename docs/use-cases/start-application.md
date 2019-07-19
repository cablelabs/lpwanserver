# Use Case - Start Application

The Start Application use case describes the steps that occur when
the user or system starts an application. This use case can be
initiated by the user, or by the system as part of pulling an application.

When the Actor initiates the use case, all errors that occur after step 6
are caught and included in the logs that are the response to the Actor.

## Success Scenario

* A: Actor, User
* S: System

1. A: Post request to start-application endpoint
2. S: Load Application
3. S: Verify that Application has baseUrl
4. S: Update application record with enabled=true
5. S: Find ApplicationNetworkTypeLinks
6. S: In parallel, call "startApplication" for each network of each linked NetworkType
7. S: Find ProtocolData with remote application ID
8. S: Load remote HTTP integration (pull-app entry)
9. S: Update remote HTTP integration (pull-app exit)
10. S: Respond to step 1 request with logs from each network

### System fails to load Application

2. S: Error occurs on load Application
3. S: Respond with error.

### Application is missing baseUrl

3. S: Fails to verify that Application has a baseUrl
4. S: Respond with error.

### System fails to update Application

4. S: Fails to update Application with enabled=true
5. S: Respond with error.

### System fails to find ApplicationNetworkTypeLinks

5. S: Fails to query for ApplicationNetworkTypeLinks
6. S: Respond with error.

### System fails to find ProtocolData

7. S: Fails to find ProtocolData with remote application ID
8. S: Return NotFound error

### System fails to load remote HTTP integration

8. S: Fails to load remote HTTP integration
9. S: Create remote HTTP integration

#### System fails to create remote HTTP integration

9. S: Fails to create remote HTTP integration
10. S: Respond with error

### System fails to update remote HTTP integration

9. S: Fails to update remote HTTP integration
10. S: Respond with error

## Issues
