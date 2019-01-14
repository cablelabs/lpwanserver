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

## Current Flow

### New Application

```sequence
client->restApplication: POST\n/api/applications
restApplication->IApplication: createApplication
IApplication->dao.application: createApplication
dao.application->DB: insertRecord
DB-->dao.application: record
dao.application-->IApplication: record
IApplication-->restApplication: record
restApplication-->client: record.id
client->restApplicationNetworkTypeLinks: POST\n/api/applicationNetworkTypeLink
restApplicationNetworkTypeLinks->IApplicationNetworkTypeLinks: createApplicationNetworkTypeLink
IApplicationNetworkTypeLinks->dao.applicationNetworkTypeLinks:createApplicationNetworkTypeLink
dao.applicationNetworkTypeLinks->DB: insert
DB-->dao.applicationNetworkTypeLinks: record
dao.applicationNetworkTypeLinks-->IApplicationNetworkTypeLinks:record
IApplicationNetworkTypeLinks->networkTypeAPI: addApplication
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
networkTypeAPI->networkProtocols: addApplication
networkProtocols->networkProtocols: getProtocol
networkProtocols->INetworkProtocols: fetch
INetworkProtocols->dao.networkProtocols: fetch 
dao.networkProtocols->DB: find networkProtocol
DB-->dao.networkProtocols: networkProtocol
dao.networkProtocols-->INetworkProtocols: networkProtocol
INetworkProtocols-->networkProtocols: networkProtocol
networkProtocols->LoRaServerV2: getApplicationAccessAccount
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
networkProtocols->LoRaServerV2: addApplication
LoRaServerV2->NetworkProtocolDataAccess: getApplicationById
NetworkProtocolDataAccess-->IApplication: getApplication
IApplication->dao.application: fetch application
dao.application->DB: find application
DB-->dao.application: application
dao.application-->IApplication: application
IApplication-->NetworkProtocolDataAccess: application
NetworkProtocolDataAccess->LoRaServerV2: application
LoRaServerV2->NetworkProtocolDataAccess: getApplicationNTL
NetworkProtocolDataAccess-->IApplicationNetworkTypeLinks: getApplicationNTL
IApplicationNetworkTypeLinks->dao.applicationNetworkTypeLinks: fetch applicationNTL
dao.applicationNetworkTypeLinks->DB: find applicationNTL
DB-->dao.applicationNetworkTypeLinks: applicationNTL
dao.applicationNetworkTypeLinks-->IApplicationNetworkTypeLinks: applicationNTL
IApplicationNetworkTypeLinks-->NetworkProtocolDataAccess: applicationNTL
NetworkProtocolDataAccess->LoRaServerV2: applicationNTL
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
LoRaServerV2->NetworkServer: POST /api/applications
LoRaServerV2->NetworkProtocolDataAccess: putProtocolDataForKey
NetworkProtocolDataAccess->IProtocolData: create ProtocolData
IProtocolData->dao.ProtocolData: create ProtocolData
dao.ProtocolData->DB: insert ProtocolData
dao.ProtocolData-->IProtocolData: ok
IProtocolData-->NetworkProtocolDataAccess: ok
NetworkProtocolDataAccess-->LoRaServerV2: ok
LoRaServerV2-->networkProtocols: status
networkProtocols-->networkTypeAPI: status
networkTypeAPI-->IApplicationNetworkTypeLinks: status
IApplicationNetworkTypeLinks-->restApplicationNetworkTypeLinks: status
restApplicationNetworkTypeLinks-->client: status
```

