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

