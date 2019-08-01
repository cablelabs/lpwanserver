# Use Case - Push Networks

The Push Networks use case describes the steps that occur when
the system pushes all networks of one NetworkType.

## Success Scenario

* S: System

1. S: Query Networks by NetworkType
2. S: In parallel, [push each Network](push-network.md)

### System fails to find Networks with NetworkType

1. S: Fails to find Networks
2. S: Respond with error.

### System fails to push all networks successfully

2. S: Fails to push all networks
3. S: Respond with error
