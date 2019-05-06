// const Client = require('../../../rest/networkProtocols/handlers/TheThingsNetwork/TtnRestClient')
// const client = new Client()

module.exports = {
  network: {
    baseUrl: 'https://account.thethingsnetwork.org',
    securityData: {
      username: process.env.TTN_USERNAME,
      password: process.env.TTN_PASSWORD,
      clientId: process.env.TTN_CLIENT_ID,
      clientSecret: process.env.TTN_CLIENT_SECRET
    }
  },
  application: {
    id: `lpwanserver-e2e-1`,
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
  async setup () {
    // let res
    // // Create App
    // await client.createApplication(this.network, this.application)
    // await client.registerApplicationWithHandler(this.network, this.application.id)
    // No device currently on TTN
  }
}
