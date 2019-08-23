const assert = require('assert')
const { setupData } = require('./setup')
const cryptoRandomString = require('crypto-random-string')
const { createLpwanClient } = require('../../clients/lpwan')

const { client: Lpwan } = createLpwanClient()

describe('Bulk device import', () => {
  let Data

  before(async () => {
    Data = await setupData()
    await Lpwan.login({
      data: { username: 'admin', password: 'password' }
    })
  })

  describe('Bulk upload IP devices', () => {
    it('Uploads a payload with a list of devices to import', async () => {
      const data = {
        deviceProfileId: Data.deviceProfile.id,
        devices: [
          { devEUI: cryptoRandomString({ length: 16 }) },
          { devEUI: cryptoRandomString({ length: 16 }) },
          { devEUI: cryptoRandomString({ length: 16 }) }
        ]
      }
      const res = await Lpwan.importDevices({ id: Data.application.id }, { data })
      assert.strictEqual(res.status, 200)
    })

    it('Device import fails if no devEUI', async () => {
      const data = {
        deviceProfileId: Data.deviceProfile.id,
        devices: [
          { devEUI: cryptoRandomString({ length: 16 }) },
          { name: 'invalid' }
        ]
      }
      const res = await Lpwan.importDevices({ id: Data.application.id }, { data })
      const invalid = res.data.filter(x => x.status === 'ERROR')
      assert.strictEqual(invalid.length, 1)
    })
  })
})
