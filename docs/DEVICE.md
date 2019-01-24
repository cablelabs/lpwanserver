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

1. Do we want to return the network information with the device
2. If so does this impact Option 1 or 2 design?

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
    "lastSeenAt": "date",
    "location": {
    	"accuracy": "number",
    	"altitude": "number",
    	"latitude": "number",
    	"longitude": "number",
    	"source": "string"
    },
    "networkDeployment": [
        {
            networkId: "string",
            remoteDeviceId: "string"
        }
    ]
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

Question:  Do we want to use Appliaction to managae the networkDeployments or use them directly?

```mermaid
sequenceDiagram
client->>WebService: POST /api/devices
WebService->>DeviceManager: create
DeviceManager->>DB: insert Device
DeviceManager->>DB: find applicationNDs
loop each NetworkDeployment
DeviceManager->>DB: fetch Network
DeviceManager->>Network: read NetworkTypeHandler(LoRa)
DeviceManager->>Network: read NetworkProtocolHandler(LSV2)
DeviceManager->>LoRaHandler: add device
LoRaHandler->>LoRaSV2Handler: add device
LoRaSV2Handler->>LoRaSV2Handler: transform data
LoRaSV2Handler->>JWTCredentials: get token
LoRaSV2Handler->>NS: POST /api/devices
NS-->>LoRaSV2Handler: 201/remoteId
LoRaSV2Handler-->>LoRaHandler: remoteId
LoRaHandler-->>DeviceManager: remoteId
DeviceManager->>DB: create deviceND with remoteId
end
DeviceManager-->>WebService: status
WebService-->>client: status
```


### Update Device 

*Note: Used LoRaServerV2 as an example, could be any protocol*

```mermaid
sequenceDiagram
client->>WebService: PUT /api/devices/:eui
WebService->>DeviceManager: update
DeviceManager->>DB: update Device
DeviceManager->>DB: find deviceNDs
loop each NetworkDeployment
DeviceManager->>DB: fetch Network
DeviceManager->>Network: read NetworkTypeHandler(LoRa)
DeviceManager->>Network: read NetworkProtocolHandler(LSV2)
DeviceManager->>LoRaHandler: update device
LoRaHandler->>LoRaSV2Handler: update device
LoRaSV2Handler->>LoRaSV2Handler: transform data
LoRaSV2Handler->>JWTCredentials: get token
LoRaSV2Handler->>NS: PUT /api/devices
NS-->>LoRaSV2Handler: 200/updated device
LoRaSV2Handler-->>LoRaHandler: status 
LoRaHandler-->>DeviceManager: status
LoRaHandler-->>DeviceManager: status 
end
DeviceManager-->>WebService: updated device
WebService-->>client: 200/updated device
```
### Get Device 

```sequence
client->WebService: GET\n/api/devices/:id
WebService->DeviceManager: fetch
DeviceManager->DB: findById Device
DeviceManager-->WebService: Device
WebService-->client: Device
```
### Delete Device 

```mermaid
sequenceDiagram
client->>WebService: DELETE /api/devices/:eui
WebService->>DeviceManager: delete
DeviceManager->>DB: find deviceNDs
loop each NetworkDeployment
DeviceManager->>DB: fetch Network
DeviceManager->>Network: read NetworkTypeHandler(LoRa)
DeviceManager->>Network: read NetworkProtocolHandler(LSV2)
DeviceManager->>LoRaHandler: delete device
LoRaHandler->>LoRaSV2Handler: delete device
LoRaSV2Handler->>JWTCredentials: get token
LoRaSV2Handler->>NS: DELETE /api/devices/:remoteId
NS-->>LoRaSV2Handler: 204
LoRaSV2Handler-->>LoRaHandler: status
LoRaHandler-->>DeviceManager: status 
end
DeviceManager->>DB: delete Device
DeviceManager-->>WebService: status
WebService-->>client: 204
```

