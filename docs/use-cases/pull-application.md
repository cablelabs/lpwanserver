# Use Case - Pull Application

The Pull Application use case describes the steps that occur when
the system pulls one application from a remote network. This doesn't
include pulling devices.

## Success Scenario

* S: System

1. S: Load remote application
2. S: Load remote application HTTP integration
3. S: Find local Application with the same name
4. S: Find ApplicationNetworkTypeLink
5. S: If HTTP integration found, [start Application](start-application.md)
6. S: Respond with remote and local application IDs

### System fails to load application

1. S: Error occurs while loading application
2. S: Respond with error

### System fails to load an existing remote HTTP integration

2. S: Error occurs while loading HTTP integration
3. S: Respond with error

### System fails to find a local app with the same name

3. S: Fails to find local app with the same name
4. S: Create a local Application
5. Resume at step 4 in success scenario

#### System fails to create Application

4. S: Fails to create Application
5. Respond with error.

### System fails to find ApplicationNetworkTypeLink

4. S: Fails to find ApplicationNetworkTypeLink
5. S: Create ApplicationNetworkTypeLink
6. S: Create a ProtocolData entry to store the remote application's ID
7. Resume at step 5 in success scenario

#### System fails to create ApplicationNetworkTypeLink

5. S: System fails to create ApplicationNetworkTypeLink
6. S: Respond with error

#### System fails to create ProtocolData for remote app ID

6. S: System fails to create ProtocolData
7. S: Respond with error

### System fails to start Application

5. S: Fails to start Application
6. S: Respond with error

## Issues

- Not all networks expose HTTP integration functionality at the API level.
- Consider including the app's LPWAN Server integration endpoint URL in the
  app body.  This would allow for users to set the HTTP integration out-of-band.
  When LPWAN Server supports auth headers for HTTP integrations, consider including
  an API key hash in the Application data model, so users can set the auth header.
- If start-app fails, the ID of the created app is not returned, and it is still enabled.
  Change sequence and/or use try-catch to handle a failed app start.
- Name shouldn't be used to match applications.  If a remote application has a local
  counterpart, then the system will have a reference to the ID.  When remote apps are fetched,
  the system should be able to find the local Application using the remote app's ID
  and the Network ID.
