const assert = require('assert')
const { prisma } = require('../../../prisma/generated/prisma-client')
const path = require('path')
const fs = require('fs')
const request = require('request-promise')
const uuid = require('uuid')
const { fork } = require('child_process')

const ipDevice = fork('./test/e2e/lib/ip-device.js')

const {
  LPWANSERVER_URL,
  APP_SERVER_URL,
  IP_DEVICE_PORT
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
      networkSettings: '{}'
    })
    let application = await prisma.createApplication({
      name: 'ip-msg-test-app',
      baseUrl: `http://app-server:3201${uplinkPath}`,
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

  before(async () => {
    // await setupData()
    ipDevice.send({ cmd: 'createServer', data: { port: IP_DEVICE_PORT, ...ipDeviceCerts } })
  })

  describe('IP Device Uplink', () => {
    it('Send an uplink message to LPWAN Server IP uplink endpoint', done => {
      const opts = {
        url: `${LPWANSERVER_URL}/api/ingest/ip-device`,
        method: 'post',
        ...ipDeviceCerts,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ msgId: 1 })
      }
      const handler = ({ event, data }) => {
        console.log(event, data)
        if (event !== 'response') return
        assert.strictEqual(data.statusCode, 204)
        ipDevice.off('message', handler)
        done()
      }
      ipDevice.on('message', handler)
      ipDevice.send({ cmd: 'sendRequest', data: opts })
    })

    it('Ensure app server received message', async () => {
      const opts = {
        url: `${APP_SERVER_URL}/requests`,
        query: {
          method: 'POST',
          path: uplinkPath,
          body: JSON.stringify({ msgId: 1 })
        },
        json: true
      }
      const body = await request(opts)
      assert(body.length > 0)
    })
  })

  describe('IP Device Downlink', () => {
    let accessToken

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
      const opts = {
        method: 'POST',
        url: `${LPWANSERVER_URL}/api/devices/${device.id}/downlink`,
        headers: { authorization: `Bearer ${accessToken}` },
        body: { jsonData: { msgId: 2 }, fCnt: 0, fPort: 1 },
        ca,
        ...requestOpts
      }
      const res = await request(opts)
      assert.strictEqual(res.statusCode, 200)
    })
  })
})
