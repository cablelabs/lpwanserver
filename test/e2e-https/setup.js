const ChirpStack1 = require('./clients/chirpstack1')
const ChirpStack2 = require('./clients/chirpstack2')
const Seeder = require('../../lib/seeder')
const R = require('ramda')

const commonSeeds = [
  {
    id: 'NetworkServer',
    items: [
      {
        id: 1,
        name: 'e2e_test_network_server'
      }
    ]
  },
  {
    id: 'Organization',
    items: [
      {
        id: 1,
        name: 'MultiTypeTest',
        displayName: 'MultiTypeTest',
        canHaveGateways: false
      },
      {
        id: 2,
        name: 'TransferLoraTest',
        displayName: 'TransferLoraTest',
        canHaveGateways: false
      }
    ]
  },
  {
    id: 'ServiceProfile',
    items: [
      {
        id: 1,
        name: 'multitype_test_service_profile',
        networkServerID: { $type: 'NetworkServer', $id: 1 },
        organizationID: { $type: 'Organization', $id: 1 }
      },
      {
        id: 1,
        name: 'transferlora_test_service_profile',
        networkServerID: { $type: 'NetworkServer', $id: 1 },
        organizationID: { $type: 'Organization', $id: 2 }
      }
    ]
  }
]

async function seedLora1 () {
  let seeds = R.clone(commonSeeds)
  seeds[0].items[0].server = process.env.CHIRPSTACK_NWKSERVER1_HOST_PORT
  seeds[0].create = async x => R.merge(x, await ChirpStack1.client.createNetworkServer(x))
  seeds[1].create = async x => R.merge(x, await ChirpStack1.client.createOrganization(x))
  seeds[2].create = async x => R.merge(x, await ChirpStack1.client.createServiceProfile(x))
  let result = await Seeder.seedData(seeds)
  Object.assign(ChirpStack1.cache, result)
  return result
}

async function seedLora2 () {
  let seeds = R.clone(commonSeeds)
  seeds[0].items[0].server = process.env.CHIRPSTACK_NWKSERVER2_HOST_PORT
  seeds[0].create = async x => R.merge(x, await ChirpStack2.client.createNetworkServer(x))
  seeds[1].create = async x => R.merge(x, await ChirpStack2.client.createOrganization(x))
  seeds[2].create = async x => R.merge(x, await ChirpStack2.client.createServiceProfile(x))
  let result = await Seeder.seedData(seeds)
  Object.assign(ChirpStack2.cache, result)
  return result
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

before(async () => {
  await wait(5000) // time needed for Lpwan Server to boot
  await Promise.all([
    seedLora1(),
    seedLora2()
  ])
})
