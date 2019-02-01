# DeviceProfile

## Notes and Ideas

- So the normalized DP has orgId and networkServerId.  Is that right or should that be in the application?
  - The networkServerId is based on/sets the region (i.e. the freq spectrum used US, Europe, etc...)

## API and Data Shape

### Create DeviceProfile

```http
POST /api/device-profiles
```

Body

```json
{
  "name": "string",
  "macVersion": "string",
  "factoryPresetFreqs": [
    "number"
  ],
  "maxDutyCycle": "number",
  "maxEIRP": "number",
  "pingSlotDR": "number",
  "pingSlotFreq": "number",
  "pingSlotPeriod": "number",
  "regParamsRevision": "string",
  "rfRegion": [
  	"AS_923", 
  	"AU_915_928",
  	"CN_470_510",
  	"CN_779_787",
  	"EU_433",
  	"EU_863_870",
  	"IN_865_867",
  	"KR_920_923",
  	"RU_864_870",
  	"US_902_928"
  ],
  "rxDROffset1": "number",
  "rxDataRate2": "number",
  "rxDelay1": "number",
  "rxFreq2": "number",
  "supports32BitFCnt": "boolean",
  "supportsClassB": "boolean",
  "supportsClassC": "boolean",
  "classBTimeout": "number",
  "classCTimeout": "number",
  "supportsJoin": "boolean"
}
```

Returns 201

```json
{}
```

### Get DeviceProfile

1. Do we want to return the network information with the DeviceProfile
2. If so does this impact Option 1 or 2 design?

```http
GET /api/device-profiles/:id
```

Returns 200

```json
{
     "name": "string",
  "macVersion": "string",
  "factoryPresetFreqs": [
    "number"
  ],
  "maxDutyCycle": "number",
  "maxEIRP": "number",
  "pingSlotDR": "number",
  "pingSlotFreq": "number",
  "pingSlotPeriod": "number",
  "regParamsRevision": "string",
  "rfRegion": [
  	"AS_923", 
  	"AU_915_928",
  	"CN_470_510",
  	"CN_779_787",
  	"EU_433",
  	"EU_863_870",
  	"IN_865_867",
  	"KR_920_923",
  	"RU_864_870",
  	"US_902_928"
  ],
  "rxDROffset1": "number",
  "rxDataRate2": "number",
  "rxDelay1": "number",
  "rxFreq2": "number",
  "supports32BitFCnt": "boolean",
  "supportsClassB": "boolean",
  "supportsClassC": "boolean",
  "classBTimeout": "number",
  "classCTimeout": "number",
  "supportsJoin": "boolean"
}
```

### Get Many DeviceProfiles

```http
GET /api/device-profiles?query=q
```

Returns 200

```json
{
  "returned": "number",
  "available": "number",
  "results": [
    {
        "DeviceProfileEUI": "string",
        "name": "string",
        "description": "DeviceProfileDescription",
        "applicationId": "string",
        "DeviceProfileProfileId": "string",
        "skipFrameCounterCheck": "boolean",
        "referenceAltitude": "number",
        "DeviceProfileStatusBattery": "number",
        "DeviceProfileStatusMargin": "number",
        "lastSeenAt": "date"
    }]
}
```

### Get an Application's DeviceProfiles

```http
GET /api/applications/:id/device-profiles?query=q
```

Returns 200

```json
{
  "returned": "number",
  "available": "number",
  "results": [
    {
        "DeviceProfileEUI": "string",
        "name": "string",
        "description": "appDescription",
        "applicationId": "string",
        "DeviceProfileProfileId": "string",
        "skipFrameCounterCheck": "boolean",
        "referenceAltitude": "number",
        "DeviceProfileStatusBattery": "number",
        "DeviceProfileStatusMargin": "number",
        "lastSeenAt": "date"
    }]
}
```



### Update DeviceProfile

```http
PUT /api/device-profiles/:eui
```

Body

```json
{
  	"DeviceProfileEUI": "string",
    "name": "string",
    "description": "DeviceProfileDescription",
    "applicationId": "string",
    "DeviceProfileProfileId": "string",
    "skipFrameCounterCheck": "boolean",
    "referenceAltitude": "number"
}
```

Return 200

```json
{
    "DeviceProfileEUI": "string",
    "name": "string",
    "description": "DeviceProfileDescription",
    "applicationId": "string",
    "DeviceProfileProfileId": "string",
    "skipFrameCounterCheck": "boolean",
    "referenceAltitude": "number",
    "DeviceProfileStatusBattery": "number",
    "DeviceProfileStatusMargin": "number",
    "lastSeenAt": "date"
}
```



### Delete DeviceProfile

```http
DELETE /api/device-profiles/:id
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

### New DeviceProfile 

*Note: Used LoRaServerV2 as an example, could be any protocol*

Question:  Do we want to use Appliaction to managae the networkDeployments or use them directly?

```sequence
client->WebService: POST\n/api/device-profiles
WebService->DeviceProfileManager: create
DeviceProfileManager->DB: insert DeviceProfile
DeviceProfileManager->ApplicationManager: add DeviceProfile
ApplicationManager->DB: findbyid application
DB-->ApplicationManager: application
Note Left of ApplicationManager: For each\nNetwork Deployment
ApplicationManager->LoRaHandler: add DeviceProfile
LoRaHandler->LoRaServerV2Handler: transform data
LoRaServerV2Handler-->LoRaHandler: transform data
LoRaHandler->NS: POST /api/device-profiles
NS-->LoRaHandler: 201/remoteId
LoRaHandler-->ApplicationManager: remoteId
ApplicationManager->DB: add remoteId\nto networkDeployment
ApplicationManager-->DeviceProfileManager: status
DeviceProfileManager-->WebService: status
WebService-->client: status
```


### Update DeviceProfile 

*Note: Used LoRaServerV2 as an example, could be any protocol*

```sequence
client->WebService: PUT\n/api/device-profiles/:id
WebService->DeviceProfileManager: upate
Note left of DeviceProfileManager: If any\nnetworkIds exist
DeviceProfileManager->networkManager: fetch networkId1, ...
networkManager->DB: find networks
DB-->networkManager: networks
networkManager-->DeviceProfileManager: networks
Note left of DeviceProfileManager: for each network
DeviceProfileManager->loRaHandler: update remote DeviceProfile
loRaHandler->LoRaServerV2Handler: translate\nDeviceProfile data
LoRaServerV2Handler-->loRaHandler: DeviceProfile data
loRaHandler->NetworkServer: PUT\n/api/device-profiles/:remoteDeviceProfileId
NetworkServer-->loRaHandler: app result
Note left of loRaHandler: If any\nintegrations exist
loRaHandler->NetworkServer: PUT\n/api/device-profiles/:remoteDeviceProfileId/integrations
NetworkServer-->loRaHandler: status
loRaHandler-->DeviceProfileManager: app result
DeviceProfileManager->DeviceProfileManager: update network\ndeployments
DeviceProfileManager->DB: update DeviceProfile
DeviceProfileManager-->WebService: DeviceProfile
WebService-->client: DeviceProfile
```
### Get DeviceProfile 

```sequence
client->WebService: GET\n/api/device-profiles/:id
WebService->DeviceProfileManager: fetch
DeviceProfileManager->DB: findById DeviceProfile
DeviceProfileManager-->WebService: DeviceProfile
WebService-->client: DeviceProfile
```
### Delete DeviceProfile 

```sequence
client->WebService: DELETE\n/api/device-profiles/:id
WebService->DeviceProfileManager: delete
Note left of DeviceProfileManager: for each network
DeviceProfileManager->loRaHandler: remove remote DeviceProfile
loRaHandler->NetworkServer: DELETE\n/api/device-profiles/:remoteDeviceProfileId
NetworkServer-->loRaHandler: result
loRaHandler-->DeviceProfileManager: result
DeviceProfileManager->DB: delete DeviceProfile
DeviceProfileManager-->WebService: status
WebService-->client: status
```

## Current Flow

### New DeviceProfile

```sequence
client->restDeviceProfile: POST\n/api/device-profiles
restDeviceProfile->IDeviceProfile: createDeviceProfile
IDeviceProfile->dao.DeviceProfile: createDeviceProfile
dao.DeviceProfile->DB: insertRecord
DB-->dao.DeviceProfile: record
dao.DeviceProfile-->IDeviceProfile: record
IDeviceProfile-->restDeviceProfile: record
restDeviceProfile-->client: record.id
client->restDeviceProfileNetworkTypeLinks: POST\n/api/DeviceProfileNetworkTypeLink
restDeviceProfileNetworkTypeLinks->IDeviceProfileNetworkTypeLinks: createDeviceProfileNetworkTypeLink
IDeviceProfileNetworkTypeLinks->dao.DeviceProfileNetworkTypeLinks:createDeviceProfileNetworkTypeLink
dao.DeviceProfileNetworkTypeLinks->DB: insert
DB-->dao.DeviceProfileNetworkTypeLinks: record
dao.DeviceProfileNetworkTypeLinks-->IDeviceProfileNetworkTypeLinks:record
IDeviceProfileNetworkTypeLinks->networkTypeAPI: addDeviceProfile
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
networkTypeAPI->networkProtocols: addDeviceProfile
networkProtocols->networkProtocols: getProtocol
networkProtocols->INetworkProtocols: fetch
INetworkProtocols->dao.networkProtocols: fetch 
dao.networkProtocols->DB: find networkProtocol
DB-->dao.networkProtocols: networkProtocol
dao.networkProtocols-->INetworkProtocols: networkProtocol
INetworkProtocols-->networkProtocols: networkProtocol
networkProtocols->LoRaServerV2: getDeviceProfileAccessAccount
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
networkProtocols->LoRaServerV2: addDeviceProfile
LoRaServerV2->NetworkProtocolDataAccess: getDeviceProfileById
NetworkProtocolDataAccess-->IDeviceProfile: getDeviceProfile
IDeviceProfile->dao.DeviceProfile: fetch DeviceProfile
dao.DeviceProfile->DB: find DeviceProfile
DB-->dao.DeviceProfile: DeviceProfile
dao.DeviceProfile-->IDeviceProfile: DeviceProfile
IDeviceProfile-->NetworkProtocolDataAccess: DeviceProfile
NetworkProtocolDataAccess->LoRaServerV2: DeviceProfile
LoRaServerV2->NetworkProtocolDataAccess: getDeviceProfileNTL
NetworkProtocolDataAccess-->IDeviceProfileNetworkTypeLinks: getDeviceProfileNTL
IDeviceProfileNetworkTypeLinks->dao.DeviceProfileNetworkTypeLinks: fetch DeviceProfileNTL
dao.DeviceProfileNetworkTypeLinks->DB: find DeviceProfileNTL
DB-->dao.DeviceProfileNetworkTypeLinks: DeviceProfileNTL
dao.DeviceProfileNetworkTypeLinks-->IDeviceProfileNetworkTypeLinks: DeviceProfileNTL
IDeviceProfileNetworkTypeLinks-->NetworkProtocolDataAccess: DeviceProfileNTL
NetworkProtocolDataAccess->LoRaServerV2: DeviceProfileNTL
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
LoRaServerV2->NetworkServer: POST /api/device-profiles
LoRaServerV2->NetworkProtocolDataAccess: putProtocolDataForKey
NetworkProtocolDataAccess->IProtocolData: create ProtocolData
IProtocolData->dao.ProtocolData: create ProtocolData
dao.ProtocolData->DB: insert ProtocolData
dao.ProtocolData-->IProtocolData: ok
IProtocolData-->NetworkProtocolDataAccess: ok
NetworkProtocolDataAccess-->LoRaServerV2: ok
LoRaServerV2-->networkProtocols: status
networkProtocols-->networkTypeAPI: status
networkTypeAPI-->IDeviceProfileNetworkTypeLinks: status
IDeviceProfileNetworkTypeLinks-->restDeviceProfileNetworkTypeLinks: status
restDeviceProfileNetworkTypeLinks-->client: status
```

