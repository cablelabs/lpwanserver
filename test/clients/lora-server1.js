const Client = require('../../rest/networkProtocols/handlers/LoraOpenSource/v1/client')

const network = {
  id: 'mylora1servernetwork',
  baseUrl: `${process.env.LORA_APPSERVER1_URL}/api`,
  securityData: {
    username: 'admin',
    password: 'admin'
  }
}

function createLoraServer1Client () {
  const client = new Client()
  const handler = {
    get (obj, method) {
      return (...args) => obj[method](network, ...args)
    }
  }

  return { client: new Proxy(client, handler), cache: {} }
}

module.exports = { createLoraServer1Client, network }
