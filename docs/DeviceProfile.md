# Device Profile

## Notes and Ideas

- ?

## API and Data Shape

### Create Device Profile

```http
POST /api/device-profiles
```

Body

```json
{
      "classBTimeout": "number",
      "classCTimeout": "number",
      "factoryPresetFreqs": [
        "number"
      ],
      "macVersion": "string",
      "maxDutyCycle": "number",
      "maxEIRP": "number",
      "name": "string",
      "pingSlotDR": "number",
      "pingSlotFreq": "number",
      "pingSlotPeriod": "number",
      "regParamsRevision": "string",
      "rfRegion": "string",
      "rxDROffset1": "number",
      "rxDataRate2": "number",
      "rxDelay1": "number",
      "rxFreq2": "number",
      "supports32BitFCnt": "boolean",
      "supportsClassB": "boolean",
      "supportsClassC": "boolean",
      "supportsJoin": "boolean"
}
```

Returns 201

```json
{}
```

### Get Device Profile

1. Do we want to return the network information with the DeviceProfile
2. If so does this impact Option 1 or 2 design?

```http
GET /api/device-profiles/:id
```

Returns 200

```json
{
   "classBTimeout": "number",
      "classCTimeout": "number",
      "factoryPresetFreqs": [
        "number"
      ],
      "macVersion": "string",
      "maxDutyCycle": "number",
      "maxEIRP": "number",
      "name": "string",
      "pingSlotDR": "number",
      "pingSlotFreq": "number",
      "pingSlotPeriod": "number",
      "regParamsRevision": "string",
      "rfRegion": "string",
      "rxDROffset1": "number",
      "rxDataRate2": "number",
      "rxDelay1": "number",
      "rxFreq2": "number",
      "supports32BitFCnt": "boolean",
      "supportsClassB": "boolean",
      "supportsClassC": "boolean",
      "supportsJoin": "boolean"
    "networkDeployment": [
        {
            networkId: "string",
            remoteDeviceProfileId: "string"
        }
    ]
}
```

### Get Many Device Profiles

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
      "classBTimeout": "number",
      "classCTimeout": "number",
      "factoryPresetFreqs": [
        "number"
      ],
      "macVersion": "string",
      "maxDutyCycle": "number",
      "maxEIRP": "number",
      "name": "string",
      "pingSlotDR": "number",
      "pingSlotFreq": "number",
      "pingSlotPeriod": "number",
      "regParamsRevision": "string",
      "rfRegion": "string",
      "rxDROffset1": "number",
      "rxDataRate2": "number",
      "rxDelay1": "number",
      "rxFreq2": "number",
      "supports32BitFCnt": "boolean",
      "supportsClassB": "boolean",
      "supportsClassC": "boolean",
      "supportsJoin": "boolean"
    }]
}
```

### Update Device Profile

```http
PUT /api/device-profiles/:id
```

Body

```json
{
  	"classBTimeout": "number",
      "classCTimeout": "number",
      "factoryPresetFreqs": [
        "number"
      ],
      "macVersion": "string",
      "maxDutyCycle": "number",
      "maxEIRP": "number",
      "name": "string",
      "pingSlotDR": "number",
      "pingSlotFreq": "number",
      "pingSlotPeriod": "number",
      "regParamsRevision": "string",
      "rfRegion": "string",
      "rxDROffset1": "number",
      "rxDataRate2": "number",
      "rxDelay1": "number",
      "rxFreq2": "number",
      "supports32BitFCnt": "boolean",
      "supportsClassB": "boolean",
      "supportsClassC": "boolean",
      "supportsJoin": "boolean"
}
```

Return 200

```json
{
        "classBTimeout": "number",
        "classCTimeout": "number",
        "factoryPresetFreqs": [
            "number"
        ],
        "macVersion": "string",
        "maxDutyCycle": "number",
        "maxEIRP": "number",
        "name": "string",
        "pingSlotDR": "number",
        "pingSlotFreq": "number",
        "pingSlotPeriod": "number",
        "regParamsRevision": "string",
        "rfRegion": "string",
        "rxDROffset1": "number",
        "rxDataRate2": "number",
        "rxDelay1": "number",
        "rxFreq2": "number",
        "supports32BitFCnt": "boolean",
        "supportsClassB": "boolean",
        "supportsClassC": "boolean",
        "supportsJoin": "boolean"
        "networkDeployment": [
            {
            networkId: "string",
            remoteDeviceProfileId: "string"
            }
    	]
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

### New Device Profile 

*Note: Used LoRaServerV2 as an example, could be any protocol*

Question:  Do we want to use Appliaction to managae the networkDeployments or use them directly?

```sequence
client->DeviceProfileService: POST\n/api/device-profiles
deviceProfileService->DeviceProfileManager: create
Note left of DeviceProfileManager: If any\nnetworkIds exist
DeviceProfileManager->networkManager: fetch networkId1, ...
networkManager->DB: find networks
DB-->networkManager: networks
networkManager-->DeviceProfileManager: networks
Note left of DeviceProfileManager: for each network
DeviceProfileManager->loRaHandler: create remote device-profile
loRaHandler->LoRaServerV2Handler: translate\ndevice-profile data
LoRaServerV2Handler-->loRaHandler: device-profile data
loRaHandler->NetworkServer: POST /api/device-profiles
NetworkServer-->loRaHandler: dp result
DeviceProfileManager->DeviceProfileManager: create network\ndeployments
DeviceProfileManager->DB: insert device-profile
DeviceProfileManager-->DeviceProfileService: status
deviceProfileService-->client: status
```


### Update Device Profile 

*Note: Used LoRaServerV2 as an example, could be any protocol*

```sequence
client->DeviceProfilesService: PUT\n/api/device-profiles/:id
DeviceProfilesService->DeviceProfilesManager: upate
Note left of DeviceProfilesManager: If any\nnetworkIds exist
DeviceProfilesManager->networkManager: fetch networkId1, ...
networkManager->DB: find networks
DB-->networkManager: networks
networkManager-->DeviceProfilesManager: networks
Note left of DeviceProfilesManager: for each network
DeviceProfilesManager->loRaHandler: update remote device-profiles
loRaHandler->LoRaServerV2Handler: translate\ndevice-profiles data
LoRaServerV2Handler-->loRaHandler: device-profiles data
loRaHandler->NetworkServer: PUT\n/api/DeviceProfiless/:remoteDeviceProfilesId
NetworkServer-->loRaHandler: dp result
DeviceProfilesManager->DeviceProfilesManager: update network\ndeployments
DeviceProfilesManager->DB: update DeviceProfiles
DeviceProfilesManager-->DeviceProfilesService: DeviceProfiles
DeviceProfilesService-->client: DeviceProfiles
```
### Get Device Profile 

```sequence
client->WebService: GET\n/api/device-profiles/:id
WebService->DeviceProfileManager: fetch
DeviceProfileManager->DB: findById DeviceProfile
DeviceProfileManager->DB: find networkDeployments\nfor dp
DeviceProfileManager->DeviceProfileManager: add nd to dp
DeviceProfileManager-->WebService: DeviceProfile
WebService-->client: DeviceProfile
```
### Delete Device Profile 

```sequence
client->WebService: DELETE\n/api/device-profiles/:id
WebService->DeviceProfileManager: delete
DeviceProfileManager->DB: get networkDeployments
Note left of DeviceProfileManager: for each network
DeviceProfileManager->loRaHandler: remove remote DeviceProfile
loRaHandler->NetworkServer: DELETE\n/api/device-profiles/:remoteDeviceProfileId
NetworkServer-->loRaHandler: result
loRaHandler-->DeviceProfileManager: result
DeviceProfileManager->DB: delete DeviceProfile
DeviceProfileManager-->WebService: status
WebService-->client: status
```

