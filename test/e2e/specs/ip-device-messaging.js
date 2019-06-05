const assert = require('assert')
const { prisma } = require('../../../prisma/generated/prisma-client')
const path = require('path')
const fs = require('fs')
const request = require('request-promise')

const {
  LPWANSERVER_URL,
  APP_SERVER_URL
} = process.env

const certFile = path.join(__dirname, '../../../certs/client-catm1-crt.pem')
const cert = fs.readFileSync(certFile, { encoding: 'utf8' })
const keyFile = path.join(__dirname, '../../../certs/client-catm1-key.pem')
const key = fs.readFileSync(keyFile, { encoding: 'utf8' })
const caFile = path.join(__dirname, '../../../certs/ca-crt.pem')
const ca = fs.readFileSync(caFile, { encoding: 'utf8' })
const requestOpts = { resolveWithFullResponse: true, json: true }
const ipDeviceCerts = { cert, key, ca }

const uplinkPath = '/uplinks'

describe.only('E2E Test for IP Device Uplink/Downlink Device Messaging', () => {
  let device

  async function setupData () {
    let ipNwkType = await prisma.networkType({ name: 'IP' })
    let postReportingProtocol = (await prisma.reportingProtocols())[0]
    let company = (await prisma.companies())[0]
    let deviceProfile = await prisma.createDeviceProfile({
      company: { connect: { id: company.id } },
      networkType: { connect: { id: ipNwkType.id } },
      name: 'ip-msg-test-dev-prof',
      networkSettings: `{}`
    })
    let application = await prisma.createApplication({
      name: 'ip-msg-test-app',
      baseUrl: `${APP_SERVER_URL}${uplinkPath}`,
      enabled: true,
      reportingProtocol: { connect: { id: postReportingProtocol.id } }
    })
    device = await prisma.createDevice({
      name: 'ip-msg-test-dvc',
      application: { connect: { id: application.id } }
    })
    await prisma.createDeviceNetworkTypeLink({
      networkType: { connect: { id: ipNwkType.id } },
      device: { connect: { id: device.id } },
      deviceProfile: { connect: { id: deviceProfile.id } },
      networkSettings: '{"devEUI":"00:11:22:33:44:55:66:77"}'
    })
  }

  before(setupData)

  describe('IP Device Uplink', () => {
    it('Send an uplink message to LPWAN Server IP uplink endpoint', async () => {
      const opts = {
        method: 'POST',
        url: `${LPWANSERVER_URL}/api/ip-device-uplinks`,
        ...ipDeviceCerts,
        ...requestOpts,
        body: { msgId: 1 }
      }

      const res = await request(opts)
      assert.strictEqual(res.statusCode, 204)
    })

    it('Ensure app server received message', async () => {
      const opts = {
        url: `${APP_SERVER_URL}/requests`,
        query: {
          method: 'POST',
          path: uplinkPath,
          body: JSON.stringify({ json: { msgId: 1 } })
        },
        json: true
      }
      const body = await request(opts)
      assert.strictEqual(body.length, 1)
    })
  })

  describe('IP Device Downlink', () => {
    let accessToken
    let downlink1 = { jsonData: { msgId: 2 }, fCnt: 0, fPort: 1 }

    it('Get auth token for LPWAN Server', async () => {
      const opts = {
        method: 'POST',
        url: `${LPWANSERVER_URL}/api/sessions`,
        body: { login_username: 'admin', login_password: 'password' },
        ca,
        json: true
      }
      accessToken = await request(opts)
      console.log(accessToken)
    })

    it('Send a downlink request to LPWAN Server', async () => {
      await sendDownlink(accessToken, device.id, downlink1)
    })

    it('Fetch downlink as IP device', async () => {
      const opts = {
        url: `${LPWANSERVER_URL}/api/ip-device-downlinks`,
        ...ipDeviceCerts,
        json: true
      }
      const body = await request(opts)
      assert.deepStrictEqual(body[0], downlink1)
    })

    it('Long poll for downlinks', async function () {
      this.timeout(140000)
      let downlink2 = { jsonData: { msgId: 3 }, fCnt: 0, fPort: 1 }

      setTimeout(() => sendDownlink(accessToken, device.id, downlink2), 3000)

      const opts = {
        url: `${LPWANSERVER_URL}/api/ip-device-downlinks`,
        ...ipDeviceCerts,
        headers: { prefer: 'wait=5' },
        json: true
      }
      const body = await request(opts)
      console.log(body)
      assert.deepStrictEqual(body[0], downlink2)
    })
  })
})

async function sendDownlink (accessToken, deviceId, body) {
  const opts = {
    method: 'POST',
    url: `${LPWANSERVER_URL}/api/devices/${deviceId}/downlinks`,
    headers: { authorization: `Bearer ${accessToken}` },
    body,
    ca,
    ...requestOpts
  }
  const res = await request(opts)
  assert.strictEqual(res.statusCode, 200)
}
