const Client = require('../../../rest/networkProtocols/handlers/TheThingsNetwork/TtnRestClient')
const client = new Client()
const { key } = require('ttn')

const timestamp = Date.now()
const APP_ID = `lpwansvr-e2e-app-${timestamp}`

module.exports = {
  client,
  network: {
    id: '4',
    baseUrl: 'https://account.thethingsnetwork.org',
    securityData: {
      username: process.env.TTN_USERNAME,
      password: process.env.TTN_PASSWORD,
      clientId: process.env.TTN_CLIENT_ID,
      clientSecret: process.env.TTN_CLIENT_SECRET
    }
  },
  application: {
    id: APP_ID,
    name: 'CableLabs Prototype',
    description: 'App for LPWAN Server E2E tests',
    rights: [
      'settings',
      'delete',
      'collaborators',
      'devices'
    ],
    access_keys: [
      {
        'rights': [
          'settings',
          'devices',
          'messages:up:r',
          'messages:down:w'
        ],
        'name': 'lpwan'
      }
    ]
  },
  abpDevice: {
    altitude: 0,
    app_id: APP_ID,
    description: 'CableLabs TTN Device ABP',
    dev_id: `lpwansvr-e2e-abp-${timestamp}`,
    latitude: 52.375,
    longitude: 4.887,
    lorawan_device: {
      dev_eui: '00A0A112727496D3',
      dev_id: `lpwansvr-e2e-abp-${timestamp}`,
      app_id: APP_ID,
      activation_constraints: 'abp',
      app_s_key: key(16),
      nwk_s_key: key(16),
      dev_addr: '01dd4aa4',
      f_cnt_down: 0,
      f_cnt_up: 0,
      disable_f_cnt_check: false
    }
  },
  otaaDevice: {
    altitude: 0,
    appID: APP_ID,
    description: 'TTN Device Using OTAA',
    dev_id: `lpwansvr-e2e-otaa-${timestamp}`,
    latitude: 52.375,
    longitude: 4.887,
    lorawan_device: {
      dev_eui: '0099F6D395BD932A',
      dev_id: `lpwansvr-e2e-otaa-${timestamp}`,
      app_id: APP_ID,
      activation_constraints: 'otaa',
      app_key: key(16)
    }
  },
  async setup () {
    // Create App
    await client.createApplication(this.network, this.application)
    await client.registerApplication(this.network, this.application.id)
    // Create Devices
    await client.createDevice(this.network, this.application.id, this.abpDevice)
    await client.createDevice(this.network, this.application.id, this.otaaDevice)
  }
}
