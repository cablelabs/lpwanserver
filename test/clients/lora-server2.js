const Client = require('../../rest/networkProtocols/handlers/LoraOpenSource/v2/client')

const network = {
  id: 'mylora1servernetwork',
  baseUrl: `${process.env.LORA_APPSERVER2_URL}/api`,
  securityData: {
    username: 'admin',
    password: 'admin'
  }
}

const client = new Client()

const handler = {
  get (obj, method) {
    return (...args) => obj[method](network, ...args)
  }
}

module.exports = {
  client: new Proxy(client, handler),
  cache: {},
  network
}
