const Client = require('../../app/networkProtocols/handlers/ChirpStack/v1/client')
const client = new Client()

module.exports = {
  client,
  network: {
    id: '1',
    baseUrl: 'https://chirpstack_app_svr_1:8080/api',
    securityData: {
      username: 'admin',
      password: 'admin'
    }
  },
  networkServer: {
    name: 'LoraOS1',
    server: 'chirpstack_nwk_svr_1:8000'
  },
  organization: {
    name: 'SysAdmins',
    displayName: 'SysAdmins',
    canHaveGateways: false
  },
  serviceProfile: {
    name: 'defaultForLPWANServer'
  },
  deviceProfile: {
    name: 'BobMouseTrapDeviceProfileLv1',
    macVersion: '1.0.0'
  },
  application: {
    name: 'BobMouseTrapLv1',
    description: 'CableLabs Test Application'
  },
  device: {
    name: 'BobMouseTrapDeviceLv1',
    description: 'Test Device for E2E',
    devEUI: '3456789012345678'
  },
  deviceActivation: {
    'appSKey': '4ccbeee6e8b1852fe70fa01a5a16403e',
    'devAddr': '01dd4aa3',
    'devEUI': '3456789012345678',
    'fCntDown': 0,
    'fCntUp': 0,
    'nwkSKey': 'b1f69424addc9e51c6da32d901fdc3f1',
    'skipFCntCheck': true
  },
  _setNetworkServerId (id) {
    this.networkServer.id = id
    this.serviceProfile.networkServerID = id
    this.deviceProfile.networkServerID = id
  },
  _setOrgId (id) {
    this.organization.id = id
    this.serviceProfile.organizationID = id
    this.deviceProfile.organizationID = id
    this.application.organizationID = id
  },
  _setServiceProfileId (id) {
    this.serviceProfile.id = id
    this.application.serviceProfileID = id
  },
  _setDeviceProfileId (id) {
    this.deviceProfile.id = id
    this.device.deviceProfileID = id
  },
  _setApplicationId (id) {
    this.application.id = id
    this.device.applicationID = id
  },
  async setup () {
    let res
    // Create Network Server
    res = await client.createNetworkServer(this.network, this.networkServer)
    this._setNetworkServerId(res.id)
    // Create Org
    res = await client.createOrganization(this.network, this.organization)
    this._setOrgId(res.id)
    // Create Service Profile
    res = await client.createServiceProfile(this.network, this.serviceProfile)
    this._setServiceProfileId(res.id)
    // Create Device Profile
    res = await client.createDeviceProfile(this.network, this.deviceProfile)
    this._setDeviceProfileId(res.id)
    // Create App
    res = await client.createApplication(this.network, this.application)
    this._setApplicationId(res.id)
    // Create Device
    await client.createDevice(this.network, this.device)
    // Activate Device
    await client.activateDevice(this.network, this.device.devEUI, this.deviceActivation)
  }
}
