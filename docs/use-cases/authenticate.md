# Use Case - Authenticate

The Authenticate use case describes the steps that occur when a user
authenticates with LPWAN Server.

## Success Scenario

* A: Actor, User
* S: System

1. A: Post credentials to authentication endpoint
2. S: Load User
3. S: Validate password
4. S: Construct and respond with token

### System fails to load User

2. S: Fails to load User
3. S: Respond with error

### System fails to verify password

3. S: Hash of submitted password doesn't match hash in User record
4. S: Respond with error.

## Issues

- Authentication system might consider blocking an IP address for
  a period of time after multiple failed attempts.
