const assert = require('assert')
const { setupData } = require('./setup')
const request = require('request-promise')
const fs = require('fs')
const path = require('path')
const cryptoRandomString = require('crypto-random-string')

const {
  LPWANSERVER_URL
} = process.env

const caFile = path.join(__dirname, '../../../certs/ca-crt.pem')
const ca = fs.readFileSync(caFile, { encoding: 'utf8' })
const requestOpts = { resolveWithFullResponse: true, json: true }

describe.only('Bulk device import', () => {
  let Data

  before(async () => {
    Data = await setupData()
  })

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
        url: `${LPWANSERVER_URL}/api/applications/${Data.application.id}/import-devices`,
        ...requestOpts,
        ca,
        body: {
          deviceProfileId: Data.deviceProfile.id,
          devices: [
            { devEUI: cryptoRandomString({ length: 16 }) },
            { devEUI: cryptoRandomString({ length: 16 }) },
            { devEUI: cryptoRandomString({ length: 16 }) }
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
        url: `${LPWANSERVER_URL}/api/applications/${Data.application.id}/import-devices`,
        ...requestOpts,
        ca,
        body: {
          deviceProfileId: Data.deviceProfile.id,
          devices: [
            { devEUI: cryptoRandomString({ length: 16 }) },
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
