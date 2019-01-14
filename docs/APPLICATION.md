# Application

## Notes and Ideas

The network intercetion I am thinking will be an array inside the application itself. The network will need a list of application ids it is associated with I think but probably not more than that. 

Requirements

- Should allow a single application to support multiple integrations

## API and Data Shape

### Create Application

*Note: `integrations` and `networks` is optional.*  

```http
POST /api/applications
```

Body

```json
{
  "name": "appName",
  "description": "appDescription",
  "payloadCodec": "string",
  "payloadDecoderScript": "string",
  "payloadEncoderScript": "string",
  "validationScript": "string",
  "supportsDownLink": "boolean",
  "running": "boolean",
  "applicationEUI": "string",
  "customerId": "string",
  "integrations": [
    {
      "baseUrl": "baseUrl",
      "reportingProtocolId": "reportingProtocolId"
    }
  ],
  "networkDeployments": [
    "networkId1",
    "networkId2"
  ]
}
```

Returns 201

```json
{}
```

### Get Application

```http
GET /api/applications/:id
```

Returns 200

```json
{
  "id": "string",
  "name": "appName",
  "description": "appDescription",
  "payloadCodec": "string",
  "payloadDecoderScript": "string",
  "payloadEncoderScript": "string",
  "validationScript": "string",
  "supportsDownLink": "boolean",
  "running": "boolean",
  "applicationEUI": "string",
  "customerId": "string",
  "integrations": [
    {
      "baseUrl": "baseUrl",
      "reportingProtocolId": "reportingProtocolId"
    }
  ],
  "networkDeployments": [
    {
    	"networkId": "string",
        "remoteApplicationId": "string",
        "serviceProfileId": "string",
        "organizationId": "string",
        "securityData": {
        	"accessToken": "string",
        	"refreshToken": "string"
    	}
    }
    ]
}
```

### Get Many Applications

```http
GET /api/applications?query=q
```

Returns 200

```json
{
  "returned": "number",
  "available": "number",
  "results": [
    {
      "id": "string",
      "name": "appName",
      "description": "appDescription",
      "running": "boolean",
      "customerId": "string",
      "networkDeployments": ["networkId1", "networkId2"]
    }]
}
```



### Update Application

```http
PUT /api/applications/:id
```

Body

```json
{
  "name": "appName",
  "description": "appDescription",
  "payloadCodec": "string",
  "payloadDecoderScript": "string",
  "payloadEncoderScript": "string",
  "validationScript": "string",
  "supportsDownLink": "boolean",
  "running": "boolean",
  "applicationEUI": "string",
  "customerId": "string",
  "integrations": [
    {
      "baseUrl": "baseUrl",
      "reportingProtocolId": "reportingProtocolId"
    }
  ],
  "networkDeployments": [
    "networkId1",
    "networkId2"
  ]
}
```

Return 200

```json
{
  "id": "string",
  "name": "appName",
  "description": "appDescription",
  "payloadCodec": "string",
  "payloadDecoderScript": "string",
  "payloadEncoderScript": "string",
  "validationScript": "string",
  "supportsDownLink": "boolean",
  "running": "boolean",
  "applicationEUI": "string",
  "customerId": "string",
  "integrations": [
    {
      "baseUrl": "baseUrl",
      "reportingProtocolId": "reportingProtocolId"
    }
  ],
  "networkDeployments": [
    {
    	"networkId": "string",
        "remoteApplicationId": "string",
        "serviceProfileId": "string",
        "organizationId": "string",
        "securityData": {
        	"accessToken": "string",
        	"refreshToken": "string"
    	}
    }
    ]
}
```



### Delete Application

```http
DELETE /api/applications/:id
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

### New Application 

*Note: Used LoRaServerV2 as an example, could be any protocol*

```sequence
client->applicationService: POST\n/api/applications
applicationService->applicationManager: create
Note left of applicationManager: If any\nnetworkIds exist
applicationManager->networkManager: fetch networkId1, ...
networkManager->DB: find networks
DB-->networkManager: networks
networkManager-->applicationManager: networks
Note left of applicationManager: for each network
applicationManager->loRaHandler: create remote application
loRaHandler->LoRaServerV2Handler: translate\napplication data
LoRaServerV2Handler-->loRaHandler: application data
loRaHandler->NetworkServer: POST /api/applications
NetworkServer-->loRaHandler: app result
Note left of loRaHandler: If any\nintegrations exist
loRaHandler->NetworkServer: POST\n/api/applications/:remoteApplicationId/integrations
NetworkServer-->loRaHandler: status
loRaHandler-->applicationManager: app result
applicationManager->applicationManager: create network\ndeployments
applicationManager->DB: insert application
applicationManager-->applicationService: status
applicationService-->client: status
```
### Update Application 

*Note: Used LoRaServerV2 as an example, could be any protocol*

```sequence
client->applicationService: PUT\n/api/applications/:id
applicationService->applicationManager: upate
Note left of applicationManager: If any\nnetworkIds exist
applicationManager->networkManager: fetch networkId1, ...
networkManager->DB: find networks
DB-->networkManager: networks
networkManager-->applicationManager: networks
Note left of applicationManager: for each network
applicationManager->loRaHandler: update remote application
loRaHandler->LoRaServerV2Handler: translate\napplication data
LoRaServerV2Handler-->loRaHandler: application data
loRaHandler->NetworkServer: PUT\n/api/applications/:remoteApplicationId
NetworkServer-->loRaHandler: app result
Note left of loRaHandler: If any\nintegrations exist
loRaHandler->NetworkServer: PUT\n/api/applications/:remoteApplicationId/integrations
NetworkServer-->loRaHandler: status
loRaHandler-->applicationManager: app result
applicationManager->applicationManager: update network\ndeployments
applicationManager->DB: update application
applicationManager-->applicationService: application
applicationService-->client: application
```
### Get Application 

```sequence
client->applicationService: GET\n/api/applications/:id
applicationService->applicationManager: fetch
applicationManager->DB: findById application
applicationManager-->applicationService: application
applicationService-->client: application
```
### Delete Application 

```sequence
client->applicationService: DELETE\n/api/applications/:id
applicationService->applicationManager: delete
Note left of applicationManager: for each network
applicationManager->loRaHandler: remove remote application
loRaHandler->NetworkServer: DELETE\n/api/applications/:remoteApplicationId
NetworkServer-->loRaHandler: result
loRaHandler-->applicationManager: result
applicationManager->DB: delete application
applicationManager-->applicationService: status
applicationService-->client: status
```

