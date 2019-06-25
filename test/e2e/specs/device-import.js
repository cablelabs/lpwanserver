const assert = require('assert')
const { prisma } = require('../../../prisma/generated/prisma-client')
const request = require('request-promise')
const fs = require('fs')
const path = require('path')

const {
  LPWANSERVER_URL
} = process.env

const caFile = path.join(__dirname, '../../../certs/ca-crt.pem')
const ca = fs.readFileSync(caFile, { encoding: 'utf8' })
const requestOpts = { resolveWithFullResponse: true, json: true }

describe.only('Bulk device import', () => {
  let deviceProfile
  let application

  async function setupData () {
    let ipNwkType = await prisma.networkType({ name: 'IP' })
    let postReportingProtocol = (await prisma.reportingProtocols())[0]
    let company = (await prisma.companies())[0]
    deviceProfile = await prisma.createDeviceProfile({
      company: { connect: { id: company.id } },
      networkType: { connect: { id: ipNwkType.id } },
      name: 'device-import-test-dev-prof',
      networkSettings: `{}`
    })
    application = await prisma.createApplication({
      name: 'device-import-test-app',
      enabled: false,
      reportingProtocol: { connect: { id: postReportingProtocol.id } }
    })
  }

  before(setupData)

  describe('Bulk upload IP devices', () => {
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
    })

    it('Uploads a payload with a list of devices to import', async () => {
      const opts = {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `${LPWANSERVER_URL}/api/applications/${application.id}/import-devices`,
        ...requestOpts,
        ca,
        body: {
          deviceProfileId: deviceProfile.id,
          devices: [
            { devEUI: '19:7A:56:16:B8:28:17:CD' },
            { devEUI: '19:7A:56:16:B8:28:43:21' },
            { devEUI: '19:7A:56:16:B8:28:EF:12' }
          ]
        }
      }

      const res = await request(opts)
      console.log(res.body)
      assert.strictEqual(res.statusCode, 200)
    })

    it('Device import fails if no devEUI', async () => {
      const opts = {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `${LPWANSERVER_URL}/api/applications/${application.id}/import-devices`,
        ...requestOpts,
        ca,
        body: {
          deviceProfileId: deviceProfile.id,
          devices: [
            { devEUI: '19:7A:56:16:B8:28:17:FE' },
            { name: 'invalid' }
          ]
        }
      }

      const res = await request(opts)
      console.log(res.body)
      const invalid = res.body.filter(x => x.status === 'ERROR')
      assert.strictEqual(invalid.length, 1)
    })
  })
})
