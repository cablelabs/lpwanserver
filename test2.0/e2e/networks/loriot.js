const Client = require('../../../rest/networkProtocols/handlers/Loriot/v4/client')
const client = new Client()

module.exports = {
  session: {
    connection: process.env.LORIOT_API_KEY
  },
  network: {
    baseUrl: 'https://us1.loriot.io/1/nwk'
  },
  application: {
    title: 'ApiTest',
    capacity: 10
  },
  device: {
    title: 'ApiTestDevice',
    description: 'Test Device for E2E',
    devEUI: '0080000004001546',
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
    res = await client.createApplication(this.session, this.network, this.application)
    this._setApplicationId(parseInt(res._id, 10))
    // Create Device
    res = await client.createDevice(this.session, this.network, this.application.id, this.device)
    this._setDeviceId(res._id)
  },

}
