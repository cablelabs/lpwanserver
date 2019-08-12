const cryptoRandomString = require('crypto-random-string')
const { client, cache } = require('../../clients/lora-server1')
const R = require('ramda')
const Seeder = require('../../../../lib/seeder')

const devEUIs = {
  deviceAbp: cryptoRandomString({ length: 16 }),
  deviceOtaa: cryptoRandomString({ length: 16 })
}

const omitDevEUI = R.omit(['devEUI'])
const omitAppId = R.omit(['applicationID'])

function makeSeeds (cache) {
  let nwkSvr = cache.NetworkServer[0]
  let org = cache.Organization[0]
  let svcProf = cache.ServiceProfile[0]

  return [
    {
      id: 'DeviceProfile',
      create: async x => R.merge(x, await client.createDeviceProfile(x)),
      items: [
        {
          id: 1,
          name: 'transfer_lora_network_abp',
          macVersion: '1.0.0',
          supportsJoin: false,
          networkServerID: nwkSvr.id,
          organizationID: org.id
        },
        {
          id: 2,
          name: 'transfer_lora_network_otaa',
          macVersion: '1.0.0',
          supportsJoin: true,
          networkServerID: nwkSvr.id,
          organizationID: org.id
        }
      ]
    },
    {
      id: 'Application',
      create: async x => R.merge(x, await client.createApplication(x)),
      items: [
        {
          id: 1,
          name: 'transfer_lora_network',
          description: 'Test Transfer Lora Network',
          payloadCodec: 'PAYLOAD_CODEC',
          payloadDecoderScript: 'PAYLOAD_DECODER_SCRIPT',
          payloadEncoderScript: 'PAYLOAD_ENCODER_SCRIPT',
          organizationID: org.id,
          serviceProfileID: svcProf.id
        }
      ]
    },
    {
      id: 'Integration',
      create: async x => R.merge(
        x,
        await client.createApplicationIntegration(x.applicationID, 'http', omitAppId(x))
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
      create: async x => R.merge(x, await client.createDevice(x)),
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
      create: async x => R.merge(x, await client.activateDevice(x.devEUI, x)),
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
      create: async x => R.merge(x, await client.createDeviceKeys(x.devEUI, omitDevEUI(x))),
      items: [
        {
          appKey: cryptoRandomString({ length: 32 }),
          devEUI: devEUIs.deviceOtaa
        }
      ]
    }
  ]
}

async function seedData () {
  const seeds = makeSeeds(cache)
  let result = await Seeder.seedData(seeds)
  Object.assign(cache, result)
  return result
}

module.exports = {
  seedData
}
