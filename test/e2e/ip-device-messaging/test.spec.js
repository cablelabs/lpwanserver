const assert = require('assert')
const { setupData } = require('./setup')
const path = require('path')
const fs = require('fs')
const https = require('https')
const axios = require('axios')
const { createLpwanClient } = require('../../clients/lpwan')

const {
  APP_SERVER_URL
} = process.env

const { client: Lpwan } = createLpwanClient()

const certFile = path.join(__dirname, '../../../certs/client-catm1-crt.pem')
const cert = fs.readFileSync(certFile, { encoding: 'utf8' })
const keyFile = path.join(__dirname, '../../../certs/client-catm1-key.pem')
const key = fs.readFileSync(keyFile, { encoding: 'utf8' })
const caFile = path.join(__dirname, '../../../certs/ca-crt.pem')
const ca = fs.readFileSync(caFile, { encoding: 'utf8' })
const ipDeviceAgent = new https.Agent({ ca, key, cert })

const uplinkPath = '/uplinks'

describe('E2E Test for IP Device Uplink/Downlink Device Messaging', () => {
  let Data

  before(async () => {
    Data = await setupData({ appBaseUrl: `${APP_SERVER_URL}${uplinkPath}` })
    await Lpwan.login({
      data: { login_username: 'admin', login_password: 'password' }
    })
  })

  describe('IP Device Uplink', () => {
    it('Send an uplink message to LPWAN Server IP uplink endpoint', async () => {
      const opts = {
        data: { msgId: 1 },
        useSession: false,
        httpsAgent: ipDeviceAgent
      }
      const res = await Lpwan.create('ip-device-uplinks', {}, opts)
      assert.strictEqual(res.status, 204)
    })

    it('Ensure app server received message', async () => {
      const opts = {
        url: `${APP_SERVER_URL}/requests`,
        params: {
          method: 'POST',
          path: uplinkPath,
          body: JSON.stringify({ msgId: 1 })
        }
      }
      const res = await axios(opts)
      assert.strictEqual(res.data.length, 1)
    })
  })

  describe('IP Device Downlink', () => {
    let downlink1 = { jsonData: { msgId: 2 }, fCnt: 0, fPort: 1 }

    it('Send a downlink request to LPWAN Server', async () => {
      await sendDownlink(Data.device.id, downlink1)
    })

    it('Fetch downlink as IP device', async () => {
      const opts = { httpsAgent: ipDeviceAgent }
      const res = await Lpwan.list('ip-device-downlinks', {}, opts)
      assert.deepStrictEqual(res.data[0], downlink1)
    })

    it('Long poll for downlinks', async function () {
      this.timeout(10000)
      let downlink2 = { jsonData: { msgId: 3 }, fCnt: 0, fPort: 1 }

      setTimeout(() => sendDownlink(Data.device.id, downlink2), 3000)

      const opts = {
        httpsAgent: ipDeviceAgent,
        headers: { prefer: 'wait=5' }
      }
      const res = await Lpwan.list('ip-device-downlinks', {}, opts)
      assert.deepStrictEqual(res.data[0], downlink2)
    })
  })
})

async function sendDownlink (deviceId, data) {
  const opts = {
    httpsAgent: ipDeviceAgent,
    data
  }
  const res = await Lpwan.create('deviceDownlinks', { id: deviceId }, opts)
  assert.strictEqual(res.status, 200)
}
