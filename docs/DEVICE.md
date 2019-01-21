# Device

## Notes and Ideas

- EUI should form the key for Devices

## API and Data Shape

### Create Device

```http
POST /api/devices
```

Body

```json
{
    "deviceEUI": "string",
    "name": "string",
    "description": "deviceDescription",
    "applicationId": "string",
    "deviceProfileId": "string",
    "skipFrameCounterCheck": "boolean",
    "referenceAltitude": "number"
}
```

Returns 201

```json
{}
```

### Get Device

```http
GET /api/devices/:eui
```

Returns 200

```json
{
    "deviceEUI": "string",
    "name": "string",
    "description": "deviceDescription",
    "applicationId": "string",
    "deviceProfileId": "string",
    "skipFrameCounterCheck": "boolean",
    "referenceAltitude": "number",
    "deviceStatusBattery": "number",
    "deviceStatusMargin": "number",
    "lastSeenAt": "date"
}
```

### Get Many Devices

```http
GET /api/devices?query=q
```

Returns 200

```json
{
  "returned": "number",
  "available": "number",
  "results": [
    {
        "deviceEUI": "string",
        "name": "string",
        "description": "deviceDescription",
        "applicationId": "string",
        "deviceProfileId": "string",
        "skipFrameCounterCheck": "boolean",
        "referenceAltitude": "number",
        "deviceStatusBattery": "number",
        "deviceStatusMargin": "number",
        "lastSeenAt": "date"
    }]
}
```

### Get an Application's Devices

```http
GET /api/applications/:id/devices?query=q
```

Returns 200

```json
{
  "returned": "number",
  "available": "number",
  "results": [
    {
        "deviceEUI": "string",
        "name": "string",
        "description": "appDescription",
        "applicationId": "string",
        "deviceProfileId": "string",
        "skipFrameCounterCheck": "boolean",
        "referenceAltitude": "number",
        "deviceStatusBattery": "number",
        "deviceStatusMargin": "number",
        "lastSeenAt": "date"
    }]
}
```



### Update Device

```http
PUT /api/devices/:eui
```

Body

```json
{
  	"deviceEUI": "string",
    "name": "string",
    "description": "deviceDescription",
    "applicationId": "string",
    "deviceProfileId": "string",
    "skipFrameCounterCheck": "boolean",
    "referenceAltitude": "number"
}
```

Return 200

```json
{
    "deviceEUI": "string",
    "name": "string",
    "description": "deviceDescription",
    "applicationId": "string",
    "deviceProfileId": "string",
    "skipFrameCounterCheck": "boolean",
    "referenceAltitude": "number",
    "deviceStatusBattery": "number",
    "deviceStatusMargin": "number",
    "lastSeenAt": "date"
}
```



### Delete Device

```http
DELETE /api/devices/:id
```

Body

```json
{}
```

Return 204

```JSON
{}
```

## Proposed Flow

### New Device 

*Note: Used LoRaServerV2 as an example, could be any protocol*

```sequence
client->DeviceService: POST\n/api/Devices
DeviceService->DeviceManager: create
Note left of DeviceManager: If any\nnetworkIds exist
DeviceManager->networkManager: fetch networkId1, ...
networkManager->DB: find networks
DB-->networkManager: networks
networkManager-->DeviceManager: networks
Note left of DeviceManager: for each network
DeviceManager->loRaHandler: create remote Device
loRaHandler->LoRaServerV2Handler: translate\nDevice data
LoRaServerV2Handler-->loRaHandler: Device data
loRaHandler->NetworkServer: POST /api/Devices
NetworkServer-->loRaHandler: app result
Note left of loRaHandler: If any\nintegrations exist
loRaHandler->NetworkServer: POST\n/api/Devices/:remoteDeviceId/integrations
NetworkServer-->loRaHandler: status
loRaHandler-->DeviceManager: app result
DeviceManager->DeviceManager: create network\ndeployments
DeviceManager->DB: insert Device
DeviceManager-->DeviceService: status
DeviceService-->client: status
```
### Update Device 

*Note: Used LoRaServerV2 as an example, could be any protocol*

```sequence
client->DeviceService: PUT\n/api/Devices/:id
DeviceService->DeviceManager: upate
Note left of DeviceManager: If any\nnetworkIds exist
DeviceManager->networkManager: fetch networkId1, ...
networkManager->DB: find networks
DB-->networkManager: networks
networkManager-->DeviceManager: networks
Note left of DeviceManager: for each network
DeviceManager->loRaHandler: update remote Device
loRaHandler->LoRaServerV2Handler: translate\nDevice data
LoRaServerV2Handler-->loRaHandler: Device data
loRaHandler->NetworkServer: PUT\n/api/Devices/:remoteDeviceId
NetworkServer-->loRaHandler: app result
Note left of loRaHandler: If any\nintegrations exist
loRaHandler->NetworkServer: PUT\n/api/Devices/:remoteDeviceId/integrations
NetworkServer-->loRaHandler: status
loRaHandler-->DeviceManager: app result
DeviceManager->DeviceManager: update network\ndeployments
DeviceManager->DB: update Device
DeviceManager-->DeviceService: Device
DeviceService-->client: Device
```
### Get Device 

```sequence
client->DeviceService: GET\n/api/Devices/:id
DeviceService->DeviceManager: fetch
DeviceManager->DB: findById Device
DeviceManager-->DeviceService: Device
DeviceService-->client: Device
```
### Delete Device 

```sequence
client->DeviceService: DELETE\n/api/Devices/:id
DeviceService->DeviceManager: delete
Note left of DeviceManager: for each network
DeviceManager->loRaHandler: remove remote Device
loRaHandler->NetworkServer: DELETE\n/api/Devices/:remoteDeviceId
NetworkServer-->loRaHandler: result
loRaHandler-->DeviceManager: result
DeviceManager->DB: delete Device
DeviceManager-->DeviceService: status
DeviceService-->client: status
```

## Current Flow

### New Device

```sequence
client->restDevice: POST\n/api/Devices
restDevice->IDevice: createDevice
IDevice->dao.Device: createDevice
dao.Device->DB: insertRecord
DB-->dao.Device: record
dao.Device-->IDevice: record
IDevice-->restDevice: record
restDevice-->client: record.id
client->restDeviceNetworkTypeLinks: POST\n/api/DeviceNetworkTypeLink
restDeviceNetworkTypeLinks->IDeviceNetworkTypeLinks: createDeviceNetworkTypeLink
IDeviceNetworkTypeLinks->dao.DeviceNetworkTypeLinks:createDeviceNetworkTypeLink
dao.DeviceNetworkTypeLinks->DB: insert
DB-->dao.DeviceNetworkTypeLinks: record
dao.DeviceNetworkTypeLinks-->IDeviceNetworkTypeLinks:record
IDeviceNetworkTypeLinks->networkTypeAPI: addDevice
networkTypeAPI->networkTypeAPI: createPromiseOperationForNetworksOfType
networkTypeAPI->NetworkProtocolDataAccess: getNetworksOfType
NetworkProtocolDataAccess->INetworks: fetch networks
INetworks->dao.networks: fetch networks
dao.networks->DB: find networks
DB-->dao.networks: networks
dao.networks-->INetworks: networks
INetworks-->NetworkProtocolDataAccess: networks
NetworkProtocolDataAccess-->networkTypeAPI: networks
Note left of networkTypeAPI: For each network
networkTypeAPI->networkProtocols: addDevice
networkProtocols->networkProtocols: getProtocol
networkProtocols->INetworkProtocols: fetch
INetworkProtocols->dao.networkProtocols: fetch 
dao.networkProtocols->DB: find networkProtocol
DB-->dao.networkProtocols: networkProtocol
dao.networkProtocols-->INetworkProtocols: networkProtocol
INetworkProtocols-->networkProtocols: networkProtocol
networkProtocols->LoRaServerV2: getDeviceAccessAccount
LoRaServerV2->NetworkProtocolDataAccess: getCompany
NetworkProtocolDataAccess->ICompany: fetch company
ICompany->dao.company: fetch company
dao.company->DB: find company
DB-->dao.company: company
dao.company-->ICompany: company
ICompany-->NetworkProtocolDataAccess: company
NetworkProtocolDataAccess-->LoRaServerV2: company
LoRaServerV2->NetworkProtocolDataAccess: getProtocolDataForKey
NetworkProtocolDataAccess->IProtocolData: fetch ProtocolData
IProtocolData->dao.ProtocolData: fetch ProtocolData
dao.ProtocolData->DB: find ProtocolData
DB-->dao.ProtocolData: sd
dao.ProtocolData-->IProtocolData: sd
IProtocolData-->NetworkProtocolDataAccess: sd
NetworkProtocolDataAccess-->LoRaServerV2: sd
LoRaServerV2->NetworkProtocolDataAccess: getProtocolDataForKey
NetworkProtocolDataAccess->IProtocolData: fetch ProtocolData
IProtocolData->dao.ProtocolData: fetch ProtocolData
dao.ProtocolData->DB: find ProtocolData
DB-->dao.ProtocolData: kd
dao.ProtocolData-->IProtocolData: kd
IProtocolData-->NetworkProtocolDataAccess: kd
NetworkProtocolDataAccess-->LoRaServerV2: kd
LoRaServerV2->NetworkProtocolDataAccess: access
NetworkProtocolDataAccess-->LoRaServerV2: login data
LoRaServerV2-->networkProtocols: login data
networkProtocols->LoRaServerV2: addDevice
LoRaServerV2->NetworkProtocolDataAccess: getDeviceById
NetworkProtocolDataAccess-->IDevice: getDevice
IDevice->dao.Device: fetch Device
dao.Device->DB: find Device
DB-->dao.Device: Device
dao.Device-->IDevice: Device
IDevice-->NetworkProtocolDataAccess: Device
NetworkProtocolDataAccess->LoRaServerV2: Device
LoRaServerV2->NetworkProtocolDataAccess: getDeviceNTL
NetworkProtocolDataAccess-->IDeviceNetworkTypeLinks: getDeviceNTL
IDeviceNetworkTypeLinks->dao.DeviceNetworkTypeLinks: fetch DeviceNTL
dao.DeviceNetworkTypeLinks->DB: find DeviceNTL
DB-->dao.DeviceNetworkTypeLinks: DeviceNTL
dao.DeviceNetworkTypeLinks-->IDeviceNetworkTypeLinks: DeviceNTL
IDeviceNetworkTypeLinks-->NetworkProtocolDataAccess: DeviceNTL
NetworkProtocolDataAccess->LoRaServerV2: DeviceNTL
LoRaServerV2->NetworkProtocolDataAccess: getProtocolDataForKey
NetworkProtocolDataAccess->IProtocolData: fetch ProtocolData
IProtocolData->dao.ProtocolData: fetch ProtocolData
dao.ProtocolData->DB: find ProtocolData
DB-->dao.ProtocolData: coNwkId
dao.ProtocolData-->IProtocolData: coNwkId
IProtocolData-->NetworkProtocolDataAccess: coNwkId
NetworkProtocolDataAccess-->LoRaServerV2: coNwkId
LoRaServerV2->NetworkProtocolDataAccess: getProtocolDataForKey
NetworkProtocolDataAccess->IProtocolData: fetch ProtocolData
IProtocolData->dao.ProtocolData: fetch ProtocolData
dao.ProtocolData->DB: find ProtocolData
DB-->dao.ProtocolData: coSPId
dao.ProtocolData-->IProtocolData: coSPId
IProtocolData-->NetworkProtocolDataAccess: coSPId
NetworkProtocolDataAccess-->LoRaServerV2: coSPId
LoRaServerV2->LoRaServerV2: translate data to LoRaV2
LoRaServerV2->NetworkServer: POST /api/Devices
LoRaServerV2->NetworkProtocolDataAccess: putProtocolDataForKey
NetworkProtocolDataAccess->IProtocolData: create ProtocolData
IProtocolData->dao.ProtocolData: create ProtocolData
dao.ProtocolData->DB: insert ProtocolData
dao.ProtocolData-->IProtocolData: ok
IProtocolData-->NetworkProtocolDataAccess: ok
NetworkProtocolDataAccess-->LoRaServerV2: ok
LoRaServerV2-->networkProtocols: status
networkProtocols-->networkTypeAPI: status
networkTypeAPI-->IDeviceNetworkTypeLinks: status
IDeviceNetworkTypeLinks-->restDeviceNetworkTypeLinks: status
restDeviceNetworkTypeLinks-->client: status
```

