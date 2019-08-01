# Use Case - Push Network

The Push Network use case describes the steps that occur when
the an Actor or the System pushes a single network.

## Success Scenario

* A: Actor
* S: System

1. A: Post request to push a Network
2. S: Load Network (create-network entry)
3. [Push applications](push-applications.md) and [device profiles](push-device-profiles.md) in parallel
4. [Push devices](push-devices.md) (create-network exit)
5. S: Respond with list of logs from networks.

### System fails to push all applications and device profiles sucessfully

3. S: Fails to push all applications and device profiles successfully
4. S: Respond with error

### System fails to push all devices successfully

4. S: Fails to push all devices successfully
5. S: Respond with error

## Issues

- System does not verify that the Network is authorized before pushing.
