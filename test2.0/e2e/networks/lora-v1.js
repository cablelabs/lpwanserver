const Client = require('../../../rest/networkProtocols/handlers/LoraOpenSource/v1/client')
const client = new Client()

module.exports = {
  account: {
    username: 'admin',
    password: 'admin'
  },
  session: {},
  network: {
    baseUrl: 'https://lora_appserver1:8080/api'
  },
  networkServer: {
    name: 'LoraOS1',
    server: 'loraserver1:8000'
  },
  organization: {
    name: 'cablelabs',
    displayName: 'CableLabs',
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
    description: 'CableLabs Test Application',
  },
  device: {
    name: 'BobMouseTrapDeviceLv1',
    description: 'Test Device for E2E',
    devEUI: '3456789012345678'
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
  _setDeviceId (id) {
    this.device.id = id
  },
  async setup () {
    let res
    // Create Session
    this.session.connection = await client.login(this.network, this.account)
    // Create Network Server
    res = await client.createNetworkServer(this.session, this.network, this.networkServer)
    this._setNetworkServerId(res.id)
    // Create Org
    res = await client.createOrganization(this.session, this.network, this.organization)
    this._setOrgId(res.id)
    // Create Service Profile
    res = await client.createServiceProfile(this.session, this.network, this.serviceProfile)
    this._setServiceProfileId(res.id)
    // Create Device Profile
    res = await client.createDeviceProfile(this.session, this.network, this.deviceProfile)
    this._setDeviceProfileId(res.id)
    // Create App
    res = await client.createApplication(this.session, this.network, this.application)
    this._setApplicationId(res.id)
    // Create Device
    res = await client.createDevice(this.session, this.network, this.application.id, this.device)
    this._setDeviceId(res.id)
  },

}
