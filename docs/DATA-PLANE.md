# DATA PLANE

## API

`/api/ingest/:applicationId/:networkId`


## Incoming Data

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

#Proposed New Flow
I think that the incoming data is sufficient for the application's purpose.  Therefore, in order to minimize the DB lookups,
I would say only pull in the network and the application.  

The purpose of the network is to see if it is enabled or not.  If not, the data is dropped
The purpose of the application is 
 1 To find out if the application is running (if no drop data)
 2 To find out the integration information

# Proposed Flow
```sequence
NetworkServer->restApplication: /api/ingest/:appId/:nwId
restApplication->INetwork: retrieve network
INetwork->DB: fetch network
DB-->INetwork: network
INetwork->restApplication: network
Note Left of restApplication: If network\n is enabled
restApplication->IApplication: passData
IApplication->DB: fetch Application
DB-->IApplication: application
Note Left of IApplication: If application\nis running
IApplication->reportingHandler: report
reportingHandler->request: POST application url
```



# Current Flow

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



# Current Post Data

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
