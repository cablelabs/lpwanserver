# DATA PLANE

## Notes and Ideas

The purpose of the network is to see if it is enabled or not.  If not, the data is dropped

Ideally, the application network intercection would conatin this so we can save the network call

The purpose of the application is 
 1 To find out if the application is running (if no drop data)
 2 To find out the integration information

Requirements

- Should support Downlink as well as uplink
- Should allow a single application to support multiple integrations
- Should allow a single device on multiple applications (?) *Not sure about this*
- Should support payload analysis for trouble shooting in UI

## API and Data Shape

### Uplink data from a Device via a Network Server

```http
POST /api/uplink/:applicationId/:networkId
```
```json
 {
    applicationID: 'string',
    applicationName: 'string',
    deviceName: 'string',
    devEUI: 'string, base64',
    rxInfo:[
    {
        gatewayID: 'string, base64',
        name: 'string',
        time: 'string, time-ISO',
        rssi: 'number',
        loRaSNR: 'number',
        location:{
            latitude: 'number',
            longitude: 'number',
            altitude: 'number'
         }
    }],
    txInfo:{
        frequency: 'number',
        dr: 'number'
    },
    adr: 'boolean',
    fCnt: 'number',
    fPort: 'number',
    data:'string, base64 e.g. eyJXRCI6ICJOVyIsICJIIC...',
  }
```
### Downlink to All Devices

```http
POST /api/downlink/:applicationId
```
```json
{
  "multicastQueueItem": {
    "data": "string",
    "fCnt": 0,
    "fPort": 0,
  }
}
```

### Downlink to a Single Device

```http
POST /api/downlink/:applicationId/:devEUI
```

```json
{
  "deviceQueueItem": {
    "confirmed": true,
    "data": "string",
    "devEUI": "string",
    "fCnt": 0,
    "fPort": 0,
    "jsonObject": "string"
  }
}
```
### Application Server Payload

*Note Application Server API is application dependent*

  ```json
  {
    applicationID: 'string',
    applicationName: 'string',
    deviceName: 'string',
    devEUI: 'string, base64',
    rxInfo:[
    {
        gatewayID: 'string, base64',
        name: 'string',
        time: 'string, time-ISO',
        rssi: 'number',
        loRaSNR: 'number',
        location:{
            latitude: 'number',
            longitude: 'number',
            altitude: 'number'
         }
    }],
    txInfo:{
        frequency: 'number',
        dr: 'number'
    },
    adr: 'boolean',
    fCnt: 'number',
    fPort: 'number',
    data:'string, base64 e.g. eyJXRCI6ICJOVyIsICJIIjogIjAiLCAidGltZSI6IC...',
  }
  ```

## Proposed Flow

### Uplink

```sequence
NetworkServer->applicationService: /api/uplink\n/:appId/:nwId
applicationService->networkManager: retrieve network
networkManager->DB: fetch network
DB-->networkManager: network
networkManager->applicationService: network
Note Left of applicationService: If network\n is enabled
applicationService->applicationManager: passData
applicationManager->DB: fetch Application
DB-->applicationManager: application
Note Left of applicationManager: If application\nis running
Note Right of applicationManager: For each integration
applicationManager->reportingHandler: report
reportingHandler->ApplicationServer: POST application url
ApplicationServer-->reportingHandler: status
reportingHandler-->applicationManager: status
Note Left of applicationManager: Combine all\n integration status
applicationManager-->applicationService: status
applicationService-->NetworkServer: status
```

### Downlink to Single Device

```sequence
ApplicationServer->applicationService: /api/downlink\n/:appId/:deviceEUI
applicationService->applicationManager: pass downlink
applicationManager->DB: fetch Application
DB-->applicationManager: application
Note Left of applicationManager: If application\nis running
Note Left of applicationManager: For each network
applicationManager->networkManager: retrieve network
networkManager->DB: fetch network
DB-->networkManager: network
networkManager->applicationManager: network
Note Left of applicationManager: If network\n is enabled
applicationManager->reportingHandler: enqueu
reportingHandler->NetworkServer: POST /api/devices\n/:devEUI/queue
NetworkServer-->reportingHandler: status
reportingHandler-->applicationManager: status
Note Left of applicationManager: Combine all\nnetwork status
applicationManager-->applicationService: status
applicationService-->ApplicationServer: status
```

### Downlink to All Devices

*Note we assume the multicast group for the application has been created with groupId = application.name*

```sequence
ApplicationServer->applicationService: /api/downlink/:appId
applicationService->applicationManager: pass downlink
applicationManager->DB: fetch Application
DB-->applicationManager: application
Note Left of applicationManager: If application\nis running
Note Left of applicationManager: For each network
applicationManager->networkManager: retrieve network
networkManager->DB: fetch network
DB-->networkManager: network
networkManager->applicationManager: network
Note Left of applicationManager: If network\n is enabled
applicationManager->reportingHandler: enqueue
reportingHandler->NetworkServer: POST /api/multicast-groups/{app.name}/queue
NetworkServer-->reportingHandler: status
reportingHandler-->applicationManager: status
Note Left of applicationManager: Combine all\nnetwork status
applicationManager-->applicationService: status
applicationService-->ApplicationServer: status
```



## Current Implementation
### API

Uplink data from a Device via a Network Server

```http
POST /api/ingest/:applicationId/:networkId
```

```json
 {
    applicationID: 'string',
    applicationName: 'string',
    deviceName: 'string',
    devEUI: 'string, base64',
    rxInfo:[
    {
        gatewayID: 'string, base64',
        name: 'string',
        time: 'string, time-ISO',
        rssi: 'number',
        loRaSNR: 'number',
        location:{
            latitude: 'number',
            longitude: 'number',
            altitude: 'number'
         }
    }],
    txInfo:{
        frequency: 'number',
        dr: 'number'
    },
    adr: 'boolean',
    fCnt: 'number',
    fPort: 'number',
    data:'string, base64 e.g. eyJXRCI6ICJOVyIsICJIIjogIjAiLCAidGltZSI6IC...',
  }

```

### Current Flow

*Note that Downlinks are not supported in the current codebase*

```sequence
NetworkServer->restApplication: /api/ingest/:appId/:nwId
restApplication->INetwork: retrieve network
INetwork->dao.network: fetch network
dao.network->DB: fetch network
DB-->dao.network: network
dao.network-->INetwork: network
INetwork->restApplication: network
Note Left of restApplication: If network\n is enabled
restApplication->IApplication: passData
IApplication->INetwork: retrieve network
INetwork->dao.network: fetch network
dao.network->DB: fetch network
DB-->dao.network: network
dao.network-->INetwork: network
INetwork-->IApplication: network
IApplication->INetworkProtocol: retrieve network protocol
INetworkProtocol->dao.networkProtocol: fetch network protocol
dao.networkProtocol->DB: fetch network protocol
DB-->dao.networkProtocol: network protocol
dao.networkProtocol-->INetworkProtocol: network protocol
INetworkProtocol-->IApplication: network protocol
IApplication->NetworkProtocolDataAccess: new dataAPI
IApplication->networkProtocol: passData
networkProtcol->activeApplicationNetworkProtocols: retrieve reportingHandler from cache
Note Left of networkProtocol: If application\nis running
networkProtocol->dataAPI: getProtocolDataWithData
dataAPI-->networkProtocol: deviceId
networkProtocol->IDevice: retrieve device
IDevice->dao.device: fetch device
dao.device->DB: fetch device
DB-->dao.device: device
dao.device-->IDevice: device
IDevice-->networkProtocol: device
Note Left of networkProtocol: Adds device meta to payload
networkProtocol->IApplication: retrieve application
IApplication->dao.application: fetch application
dao.application->DB: fetch application
DB-->dao.application: application
dao.application-->IApplication: application
IApplication-->networkProtocol: application
Note Left of networkProtocol: Adds application meta to payload
Note Left of networkProtocol: Adds network meta to payload
networkProtocol->reportingHandler: report
reportingHandler->request: POST application url
```



### Application Server Payload

*Note Application Server API is application dependent*

  ```json
  {
    applicationID: 'string',
    applicationName: 'string',
    deviceName: 'string',
    devEUI: 'string, base64',
    rxInfo:[
    {
        gatewayID: 'string, base64',
        name: 'string',
        time: 'string, time-ISO',
        rssi: 'number',
        loRaSNR: 'number',
        location:{
            latitude: 'number',
            longitude: 'number',
            altitude: 'number'
         }
    }],
    txInfo:{
        frequency: 'number',
        dr: 'number'
    },
    adr: 'boolean',
    fCnt: 'number',
    fPort: 'number',
    data:'string, base64 e.g. eyJXRCI6ICJOVyIsICJIIjogIjAiLCAidGltZSI6IC...',
    deviceInfo: {
        name: 'string',
        description: 'string',
        model: 'string'
    },
    applicationInfo: {
        name: 'string'
    },
    networkInfo: {
        name: 'string'
    }
  }
  ```
