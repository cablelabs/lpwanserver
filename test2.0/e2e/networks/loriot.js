const Client = require('../../../rest/networkProtocols/handlers/Loriot/v4/client')
const client = new Client()

module.exports = {
  network: {
    baseUrl: 'https://us1.loriot.io/1/nwk',
    securityData: {
      apiKey: process.env.LORIOT_API_KEY
    }
  },
  application: {
    title: 'ApiTest',
    capacity: 10
  },
  device: {
    title: 'ApiTestDevice',
    description: 'Test Device for E2E',
    deveui: '0080000004001546',
    devclass: 'A',
    lorawan: { major: '1', minor: '0', revision: '0' }
  },
  _setApplicationId (id) {
    this.application.id = id
  },
  _setDeviceId (id) {
    this.device.id = id
  },
  async setup () {
    let res
    // Create App
    res = await client.createApplication(this.network, this.application)
    this._setApplicationId(parseInt(res._id, 10))
    // Create Device
    // Loriot automatically assigns the device ABP properties, so no need to activate
    res = await client.createDevice(this.network, this.application.id, this.device)
    this._setDeviceId(res._id)
  }
}
