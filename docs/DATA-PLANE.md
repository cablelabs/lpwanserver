# Flow
`/api/ingest/:applicationId/:networkId`

```
(restApplication::ingest) -> 
    get network (INetwork) -> (dao/network) -> DB 
    if network enabled -> 
        applications.passData
        
(IAppliation::passData) ->
    get network (INetwork) -> (dao/network) -> DB
    getProtocol (INetworkProtocol) -> (dao/networkProtocol) -> DB
        create DataAPI
        protocol.passData
    
(Protocol (e.g. LoRaOpenSourceV2)::passData) -> 
    get ReportingHandler -> reporting protocol array
    if not running
        rejects
    else 
        get Device Id from EUI -> getProtocolData -> DB
        get Device -> IDevice -> dao/device -> DB 
        add device data to payload
        get application -> IApplication -> dao/device -> DB 
        add application data to payload
        add network data to payload
        reportingHandler.report
        
(ReportingHandler.report) ->
    Post data
```

# Data
  ```
  data = {
    "applicationID":"83",
    "applicationName":"weather-app",
    "deviceName":"00800000040008D3",
    "devEUI":"00800000040008d3",
    "rxInfo":[
    {
        "gatewayID":"00800000a0001545",
        "name":"SouthCourt",
        "time":"0001-01-01T00:00:00Z",
        "rssi":-62,
        "loRaSNR":11.5,
        "location":{
            "latitude":37.42035315472687,
            "longitude":-122.12047755718233,
            "altitude":0
         }
    }],
    "txInfo":{
        "frequency":902300000,
        "dr":2
    },
    "adr":false,
    "fCnt":15785,
    "fPort":1,
    "data":"eyJXRCI6ICJOVyIsICJIIjogIjAiLCAidGltZSI6ICIwIiwgIlAiOiAiMC4wMCIsICJXUyI6ICIwLjAiLCAiVCI6ICIwLjAiLCAiUkMiOiAiMC4wMCJ9",
    deviceInfo: {
        name: name,
        description: description,
        model: model
    },
    applicationInfo: {
        name: name
    },
    networkInfo: {
        name: name
    }
  }
```
