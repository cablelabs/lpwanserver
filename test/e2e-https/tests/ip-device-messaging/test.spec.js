const assert = require('assert')
const { setupData } = require('./setup')
const axios = require('axios')
const { createLpwanClient, catM1DeviceAgent } = require('../../clients/lpwan')

const {
  APP_SERVER_URL
} = process.env

const { client: Lpwan } = createLpwanClient()

const uplinkPath = '/ip-device-messaging-uplinks'

describe('E2E Test for IP Device Uplink/Downlink Device Messaging', () => {
  let Data

  before(async () => {
    Data = await setupData({ appBaseUrl: `${APP_SERVER_URL}${uplinkPath}` })
    await Lpwan.login({
      data: { username: 'admin', password: 'password' }
    })
  })

  describe('IP Device Uplink', () => {
    it('Send an uplink message to LPWAN Server IP uplink endpoint', async () => {
      const opts = {
        data: { msgId: 1 },
        useSession: false,
        httpsAgent: catM1DeviceAgent
      }
      const res = await Lpwan.create('uplinks', {}, opts)
      assert.strictEqual(res.status, 204)
    })

    it('Ensure app server received message', async () => {
      const opts = {
        url: `${APP_SERVER_URL}/requests`,
        params: {
          method: 'POST',
          path: uplinkPath,
          body: JSON.stringify({ data: { msgId: 1 } })
        }
      }
      const res = await axios(opts)
      assert.strictEqual(res.data.length, 1)
    })
  })

  describe('IP Device Downlink', () => {
    let downlink1 = { jsonObject: { msgId: 2 }, fCnt: 0, fPort: 1 }

    it('Send a downlink request to LPWAN Server', async () => {
      await sendDownlink(Data.device.id, downlink1)
    })

    it('Fetch downlink as IP device', async () => {
      const opts = { httpsAgent: catM1DeviceAgent }
      const res = await Lpwan.list('downlinks', {}, opts)
      assert.deepStrictEqual(res.data[0], downlink1)
    })

    it('Long poll for downlinks', async function () {
      this.timeout(10000)
      let downlink2 = { jsonObject: { msgId: 3 }, fCnt: 0, fPort: 1 }

      setTimeout(() => sendDownlink(Data.device.id, downlink2), 3000)

      const opts = {
        httpsAgent: catM1DeviceAgent,
        headers: { prefer: 'wait=5' }
      }
      const res = await Lpwan.list('downlinks', {}, opts)
      assert.deepStrictEqual(res.data[0], downlink2)
    })
  })
})

async function sendDownlink (deviceId, data) {
  const res = await Lpwan.create('deviceDownlinks', { id: deviceId }, { data })
  assert.strictEqual(res.status, 200)
}
