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
const omitAppId = R.omit(['applicationID'])

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
        server: process.env.LORA_SERVER1_HOST_PORT
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
  },
  {
    id: 'DeviceProfile',
    create: x => mergeResponse(client.createDeviceProfile(x), x),
    items: [
      {
        id: 1,
        name: 'transfer_lora_network_abp',
        macVersion: '1.0.0',
        supportsJoin: false,
        networkServerID: { $type: 'NetworkServer', $id: 1 },
        organizationID: { $type: 'Organization', $id: 1 }
      },
      {
        id: 2,
        name: 'transfer_lora_network_otaa',
        macVersion: '1.0.0',
        supportsJoin: true,
        networkServerID: { $type: 'NetworkServer', $id: 1 },
        organizationID: { $type: 'Organization', $id: 1 }
      }
    ]
  },
  {
    id: 'Application',
    create: x => mergeResponse(client.createApplication(x), x),
    items: [
      {
        id: 1,
        name: 'transfer_lora_network',
        description: 'Test Transfer Lora Network',
        payloadCodec: 'PAYLOAD_CODEC',
        payloadDecoderScript: 'PAYLOAD_DECODER_SCRIPT',
        payloadEncoderScript: 'PAYLOAD_ENCODER_SCRIPT',
        organizationID: { $type: 'Organization', $id: 1 },
        serviceProfileID: { $type: 'ServiceProfile', $id: 1 }
      }
    ]
  },
  {
    id: 'Integration',
    create: x => mergeResponse(
      client.createApplicationIntegration(x.applicationID, 'http', omitAppId(x)),
      x
    ),
    items: [
      {
        id: 1,
        uplinkDataURL: 'https://example.com/uplinks',
        applicationID: { $type: 'Application', $id: 1 }
      }
    ]
  },
  {
    id: 'Device',
    create: x => mergeResponse(client.createDevice(x), x),
    items: [
      {
        name: 'transfer_lora_network_abp',
        description: 'ABP device in Test Transfer Lora Network Test',
        devEUI: devEUIs.deviceAbp,
        skipFCntCheck: true,
        deviceProfileID: { $type: 'DeviceProfile', $id: 1 },
        applicationID: { $type: 'Application', $id: 1 }
      },
      {
        name: 'transfer_lora_network_otaa',
        description: 'OTAA device in Test Transfer Lora Network Test',
        devEUI: devEUIs.deviceOtaa,
        skipFCntCheck: false,
        deviceProfileID: { $type: 'DeviceProfile', $id: 2 },
        applicationID: { $type: 'Application', $id: 1 }
      }
    ]
  },
  {
    id: 'DeviceActivation',
    create: x => mergeResponse(client.activateDevice(x.devEUI, x), x),
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
    create: x => mergeResponse(client.createDeviceKeys(x.devEUI, omitDevEUI(x)), x),
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
