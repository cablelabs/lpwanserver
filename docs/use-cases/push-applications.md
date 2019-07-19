# Use Case - Push Applications

The Push Applications use case describes the steps that occur when
the system pushes all applications to a remote network.

## Success Scenario

* S: System

1. S: Fetch all local applications
2. S: For all apps in parallel, [push application](push-application.md)

### System fails list local applications

1. S: Fails to list local applications
2. S: Respond with error

### System fails to push all applications

2. S: Fails to push all applications successfully
3. S: Respond with failed push error

## Issues

- Failure to push any application will halt operation.
- If an error occurs, the user doesn't receive feedback as to which
  apps were pushed.  Process should use a
  [reflect abstraction](https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises)
  to prevent Promise.all from rejecting.
