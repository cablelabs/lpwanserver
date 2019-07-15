const { createLoraServer2Client } = require('../../clients/lora-server2')
const Seeder = require('../../../lib/seeder')

const { client, cache } = createLoraServer2Client()

const mergeResponse = async (promise, data) => {
  const res = await promise
  return { ...data, ...res }
}

const seeds = [
  {
    id: 'NetworkServer',
    create: x => mergeResponse(client.createNetworkServer(x), x),
    items: [
      {
        id: 1,
        name: 'transfer_lora_network',
        server: process.env.LORA_SERVER2_HOST_PORT
      }
    ]
  },
  {
    id: 'Organization',
    create: x => mergeResponse(client.createOrganization(x), x),
    items: [
      {
        id: 1,
        name: 'SysAdmins',
        displayName: 'SysAdmins',
        canHaveGateways: false
      }
    ]
  },
  {
    id: 'ServiceProfile',
    create: x => mergeResponse(client.createServiceProfile(x), x),
    items: [
      {
        id: 1,
        name: 'transfer_lora_network',
        networkServerID: { $type: 'NetworkServer', $id: 1 },
        organizationID: { $type: 'Organization', $id: 1 }
      }
    ]
  }
]

async function seedData () {
  let result = await Seeder.seedData(seeds)
  Object.assign(cache, result)
  return result
}

module.exports = {
  client,
  cache,
  seedData,
  seeds
}
