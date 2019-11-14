# Use Case - LoRa Network Transfer

The LoRa Network Transfer use case describes the steps that occur
when transferring all applications and devices from one
LoRa network to the next.

**Networks**
* ChirpStack V1
* ChirpStack V2

Testing the transfer from ChirpStack v1 to ChirpStack v2 will
mainly cover the steps and data models that enable the transfer.
There will be a minimal amount of data property renaming.  The tests
will cover the transfer of LoRaWAN 1.0 devices to a network that supports
LoRAWAN 1.0 and 1.1.

## Steps

* A: Actor, User with role "USER"
* S: System

1. [Authenticate](authenticate.md)
2. [Create ChirpStack v1 network](create-network.md)
3. [Create ChirpStack v2 network](create-network.md)

### Authentication fails

1. S: Authentication fails
2. Response determined by Authentication use case

### Create ChirpStack v1 Network Fails

2. S: Fails to create Network (includes pull/push)
3. S: Response determined by Create Network use case

### Create ChirpStack v2 Network Fails

3. S: Fails to create Network (includes pull/push)
4. S: Response determined by Create Network use case

## Result

All Applications, Device Profiles, and Devices are transferred, and property values were
correct when inspected.

## Issues

- No one-way transfer. All apps and devices on the destination network will be pushed to the source network.
- No ability to choose apps to be transferred.
- Transfer happens implicitly when 2 networks are added.
  Explicit transfer interface would be more appropriate, once one-way transfer is supported.
- 1 Actor's action can map to several (several!) System actions, any of which could fail
  and leave the transfer in a partially fulfilled state, with no course prescribed for
  how to fix. A "Deployment" resource would make actions more atomic, and provide insight
  into network sync issues.
