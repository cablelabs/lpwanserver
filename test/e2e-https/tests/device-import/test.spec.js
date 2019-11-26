const assert = require('assert')
const { setupData } = require('./setup')
const cryptoRandomString = require('crypto-random-string')
const { createLpwanClient } = require('../../clients/lpwan')
const R = require('ramda')
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
        devices: R.range(1, 4).map(_ => {
          let devEUI = cryptoRandomString({ length: 16 })
          return { devEUI, name: devEUI }
        })
      }
      try {
        const res = await Lpwan.importDevices({ id: Data.application.id }, { data })
        assert.strictEqual(res.status, 200)
      }
      catch (err) {
        console.error(err)
      }
    })

    it('Device import fails if no devEUI', async () => {
      const data = {
        deviceProfileId: Data.deviceProfile.id,
        devices: [
          { devEUI: cryptoRandomString({ length: 16 }) },
          { name: 'invalid' }
        ]
      }
      assert.rejects(() => Lpwan.importDevices({ id: Data.application.id }, { data }))
    })
  })
})
