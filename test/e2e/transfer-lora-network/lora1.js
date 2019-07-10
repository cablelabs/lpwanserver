const cryptoRandomString = require('crypto-random-string')
const { createLoraServer1Client } = require('../../clients/lora-server1')
const R = require('ramda')
const Seeder = require('../../../lib/seeder')

const { client, cache } = createLoraServer1Client()

const devEUIs = {
  deviceAbp: cryptoRandomString({ length: 16 }),
  deviceOtaa: cryptoRandomString({ length: 16 })
}

const omitDevEUI = R.omit(['devEUI'])

const seeds = [
  {
    id: 'NetworkServer',
    create: x => client.createNetworkServer(x),
    items: [
      {
        id: 1,
        name: 'test_transfer_lora_network',
        server: process.env.LORA_SERVER1_HOST_PORT
      }
    ]
  },
  {
    id: 'Organization',
    create: x => client.createOrganization(x),
    items: [
      {
        id: 1,
        name: 'test_transfer_lora_network',
        displayName: 'Test Transfer Lora Network',
        canHaveGateways: false
      }
    ]
  },
  {
    id: 'ServiceProfile',
    create: x => client.createServiceProfile(x),
    items: [
      {
        id: 1,
        name: 'test_transfer_lora_network',
        networkServerID: { $type: 'NetworkServer', $id: 1 },
        organizationID: { $type: 'Organization', $id: 1 }
      }
    ]
  },
  {
    id: 'DeviceProfile',
    create: x => client.createDeviceProfile(x),
    items: [
      {
        id: 1,
        name: 'test_transfer_lora_network',
        macVersion: '1.0.0',
        networkServerID: { $type: 'NetworkServer', $id: 1 },
        organizationID: { $type: 'Organization', $id: 1 }
      }
    ]
  },
  {
    id: 'Application',
    create: x => client.createApplication(x),
    items: [
      {
        id: 1,
        name: 'test_transfer_lora_network',
        description: 'Test Transfer Lora Network',
        organizationID: { $type: 'Organization', $id: 1 },
        serviceProfileID: { $type: 'ServiceProfile', $id: 1 }
      }
    ]
  },
  {
    id: 'Device',
    create: x => client.createDevice(x),
    items: [
      {
        name: 'test_transfer_lora_network_dev_abp',
        description: 'ABP device in Test Transfer Lora Network Test',
        devEUI: devEUIs.deviceAbp,
        deviceProfileID: { $type: 'DeviceProfile', $id: 1 },
        applicationID: { $type: 'Application', $id: 1 }
      },
      {
        name: 'test_transfer_lora_network_dev_otaa',
        description: 'OTAA device in Test Transfer Lora Network Test',
        devEUI: devEUIs.deviceOtaa,
        deviceProfileID: { $type: 'DeviceProfile', $id: 1 },
        applicationID: { $type: 'DeviceProfile', $id: 1 }
      }
    ]
  },
  {
    id: 'DeviceActivation',
    create: x => client.activateDevice(x.devEUI, x),
    items: [
      {
        'appSKey': cryptoRandomString({ length: 32 }),
        'devAddr': cryptoRandomString({ length: 8 }),
        'devEUI': devEUIs.deviceAbp,
        'fCntDown': 0,
        'fCntUp': 0,
        'nwkSKey': cryptoRandomString({ length: 32 }),
        'skipFCntCheck': true
      }
    ]
  },
  {
    id: 'DeviceKey',
    create: x => client.createDeviceKeys(x.devEUI, omitDevEUI(x)),
    items: [
      {
        appKey: cryptoRandomString({ length: 32 }),
        devEUI: devEUIs.deviceOtaa
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
