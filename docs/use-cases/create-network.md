# Use Case - Create Network

The Create Network use case describes the steps that occur when
a user create's a network.

## Success Scenario

* A: Actor, User
* S: System

1. A: Post the data that represents the network to be created
2. S: Create Network
3. S: Authenticate with remote network
4. [Pull network](pull-network.md)
5. [Push all remote networks of same NetworkType](push-networks.md)
6. S: Respond with Network.

### System fails to create the Network

2. S: Fails to create Network
3. S: Respond with error.

### Network doesn't include authentication data

3. S: Respond with Network.

### System fails to authenticate with network

3. S: Fails to authenticate with remote network
4. S: Respond with Network.  Network.securityData.message="Pending Authorization"

### System fails to pull network

4. S: Error occurs while pulling network
5. S: Respond with the error.

### System fails to push all networks

5. S: Error occurs while pushing all networks
6. S: Respond with the error.

## Issues

- In the event pull or push fails, the network isn't deleted or returned to the user.
