## API Design Principles

- A manager is reponsible for tasks maininly in their area (e.g. DeviceManager for Device operations)
- API should be built to easy port to micro services
- All DB specific formats/operations should be behind the DB Handler (e.g. SQL versus NoSQL queries formats) 
- Operations should be done through CRUD operations as much as possible.  So use flags and PUTS rather than /api/resourse/:id/operation 

## System Architecture

### Uplink LoRa Server

```mermaid
graph LR
subgraph configuring devices
Device1[Device] == configured ==> USDeviceProfile(US Device Profile)
Device2[Device] == configured ==> EuropeanDeviceProfile(European Device Profile)
end
Device1[Device]-->|US_902_928|USGateway[Gateway]
Device2[Device]-->|EU_863_870|EGateway[Gateway]
USGateway-->|MQQT|USLoRaServer[US LoRaServer]
EGateway-->|MQQT|EuropeLoRaServer[European LoRaServer]
USGateway-->|MQQT|USWestHandler
EGateway-->|MQQT|EuropeHandler
USGateway-->|MQQT|US1
EGateway-->|MQQT|EU1
subgraph LoRaServer
USLoRaServer-->|HTTP|LoRaAppServer
EuropeLoRaServer-->|HTTP|LoRaAppServer
end
subgraph TTN
USWestHandler-->|MQQT|TTNAppServer
EuropeHandler-->|MQQT|TTNAppServer
end
subgraph Loriot
US1-->|MQQT|LoriotCloud
EU1-->|MQQT|LoriotCloud
end
LoriotCloud-->|"HTTP"|LPWanServer
TTNAppServer-->|"HTTP"|LPWanServer
LoRaAppServer-->|"HTTP"|LPWanServer
LPWanServer-->|HTTP|Application

```

### Downlink LoRa Server

```mermaid
graph LR
subgraph configuring devices
Device1[Device] == configured ==> USDeviceProfile(US Device Profile)
Device2[Device] == configured ==> EuropeanDeviceProfile(European Device Profile)
end
Application-->|http|LPWanServer
LPWanServer-->|http|LoRaAppServer
LoRaAppServer-->|http|EuropeLoRaServer
EuropeLoRaServer[European LoRaServer]-->|mqqt|EGateway[Gateway]
LoRaAppServer-->|http|USLoRaServer
USLoRaServer[US LoRaServer]-->|mqqt|USGateway[Gateway]
USGateway[Gateway]-->|US_902_928|Device1
EGateway[Gateway]-->|EU_863_870|Device2

```



## LPWanServer Design

```mermaid
graph LR
WS[Web Service]
AM[ApplicationManager]
DM[DeviceManager]
DPM[Device Profile Manager]
NM[Network Manager]

DB[Database Handler]
LH[LoRa Handler]
LSV1[LoRa Server V1 Handler]
LSV2[LoRa Server V2 Handler]
TTN[TTN Handler]
LR[Loriat Handler]

JWT[JWT Auth Handler]
OAUTH2[OAUTH2 Auth Handler]
AK[API Key Auth Handler]

WS --> NM
WS --> AM
WS --> DM
WS --> DPM
AM --> DB
DM --> DB
DPM --> DB
NM --> DB

AM --> NM
DM --> NM
DPM --> NM

DM --> DPM

NM --> LH
LH --> LSV1
LH --> LSV2
LH --> TTN
LH --> LR

LSV1 --> JWT
LSV2 --> JWT
TTN --> OAUTH2
LR --> AK


```



## Data Model

```mermaid
graph LR
A[Application<hr>AppId] 
B[Device<hr>EUI]
C[Device Profile<hr>dpId]
D[AppNetworkDeployment<hr>remoteAppId]
E[Network<hr>networkId<br>orgId]
G[DeviceProfileNetworkDeployment<hr>remoteDPId<br>networkServerId<br>]
H[Integration<hr>url]
I[NetworkTypeHandler]
J[ProtcolHandler]
K[DeviceNetworkDeployment<hr>Option2:remoteDeviceId]
L[Credentials]
M[AuthHandler]
A --> |1:many|B
A --> |1:many|H
B --> |many:1|C
A --> |1:many| D
D --> |many:1| E
C --> |1:many| G
G --> |many:1| E
E --> |many:1| I
E --> |many:1| J
B --> |1:many| K
K --> |many:1| E
E --> |1:1| L
E --> |1:1| M
```

