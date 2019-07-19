# Use Case - Pull Applications

The Pull Applications use case describes the steps that occur when
the system pulls all applications from a remote network.

## Success Scenario

* S: System

1. S: Fetch all applications from remote network, limited to 9,999
2. S: For all apps in parallel, [pull application](pull-application.md)
3. S: Return an array of objects with references to the remote app ID and local app ID

### System fails to fetch a list of applications

1. S: Fails to fetch applications from remote network.
2. S: Respond with error

### System fails to pull all applications

2. S: Fails to pull all applications successfully
3. S: Respond with failed pull error

## Issues

- Failure to pull any application will halt operation.
- If an error occurs, the user doesn't receive feedback as to which
  apps were pulled.  Process should use a
  [reflect abstraction](https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises)
  to prevent Promise.all from rejecting.
