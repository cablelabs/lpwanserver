let chai = require('chai')
let chaiHttp = require('chai-http')
const { createApp } = require('../../../app/express-app')
let setup = require('../setup.js')
const Lora1 = require('../../networks/lora-v1')
const Lora2 = require('../../networks/lora-v2')
// const Ttn = require('../../networks/ttn')
const createRcServer = require('../../lib/rc-server')
const { wait } = require('../../lib/helpers')

var should = chai.should()
chai.use(chaiHttp)
let server

// let ttnDownlinkVerified = false

// async function listenForTtnDownlink () {
//   const apps = await Ttn.client.listApplications(Ttn.network)
//   const app = apps.find(x => x.name === Lora2.application.name)
//   should.exist(app)
//   const { dataClient } = await Ttn.client.getDataClient(Ttn.network, app.id)
//   dataClient.on("event", "+", "downlink/scheduled", (devId, payload) => {
//     ttnDownlinkVerified = true
//     console.log(`TTN DOWNLINK downlink/scheduled EVENT: ${JSON.stringify(payload)}`)
//   })
//   dataClient.on("event", "+", "downlink/sent", (devId, payload) => {
//     ttnDownlinkVerified = true
//     console.log(`TTN DOWNLINK downlink/sent EVENT: ${JSON.stringify(payload)}`)
//   })
// }

describe('E2E Test for Uplink/Downlink Device Messaging', () => {
  let adminToken = ''
  let rcServer
  let lora2AppId = ''
  let lora2DevId = ''

  const APP_SERVER_UPLINK_URL = `http://e2e-test:${process.env.APP_SERVER_PORT}/uplinks`

  const send = (request, data) => request
    .set('Authorization', 'Bearer ' + adminToken)
    .set('Content-Type', 'application/json')
    .send(data)

  before(async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    await setup.start()
    rcServer = await createRcServer({
      port: process.env.APP_SERVER_PORT,
      maxRequestAge: 5000
    })
  })

  it('Admin Login to LPWan Server', async () => {
    const res = await server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
    res.should.have.status(200)
    adminToken = res.text
  })

  describe('Update the application baseUrls', () => {
    describe('Setup application for messaging', () => {
      it('Find LPWAN Server application ID', async () => {
        const res = await send(server.get('/api/applications'))
        res.should.have.status(200)
        let { records } = JSON.parse(res.text)
        const app = records.find(x => x.name === Lora2.application.name)
        should.exist(app)
        lora2AppId = app.id
      })
      it('Update application baseUrl', async () => {
        const res = await send(
          server.put('/api/applications/' + lora2AppId),
          { baseUrl: APP_SERVER_UPLINK_URL }
        )
        res.should.have.status(204)
      })
      it('Start application', async () => {
        const res = await send(server.post(`/api/applications/${lora2AppId}/start`))
        res.should.have.status(200)
      })
    })
    describe('Send uplink message to LPWAN Server', () => {
      it('Post an uplink message to the LPWAN Server uplink endpoint', async () => {
        const res = await send(
          server.post(`/api/ingest/${lora2AppId}/${Lora2.network.id}`),
          { msgId: 1 }
        )
        res.should.have.status(204)
      })
      it('Ensure app server received message', async () => {
        await rcServer.listRequests({
          method: 'POST',
          path: '/uplinks',
          body: { msgId: 1 }
        })
      })
    })
    describe('Send a downlink message to a device', () => {
      it('Find LPWAN Server device ID', async () => {
        const res = await send(server.get(`/api/devices?search=${Lora2.device.name}`))
        res.should.have.status(200)
        let { records } = JSON.parse(res.text)
        const device = records[0]
        should.exist(device)
        lora2DevId = device.id
      })
      it('Pass data to device', async () => {
        const data = Buffer.from('01 17 01').toString('base64')
        const res = await send(
          server.post(`/api/devices/${lora2DevId}/downlinks`),
          { data, fCnt: 0, fPort: 1 }
        )
        console.log(res.text)
        res.status.should.equal(200)
      })
      it('Get device message from Lora Server v1 queue', async () => {
        const res = await Lora1.client.listDeviceMessages(Lora1.network, Lora2.device.devEUI)
        res.result.length.should.equal(1)
      })
      it('Get device message from Lora Server v2 queue', async () => {
        const res = await Lora2.client.listDeviceMessages(Lora2.network, Lora2.device.devEUI)
        res.result.length.should.equal(1)
      })
    })
    describe('Ensure messages are dropped when an application is stopped', () => {
      it('Stop application', async () => {
        const res = await send(server.post(`/api/applications/${lora2AppId}/stop`))
        res.should.have.status(200)
      })
      it('Post an uplink message to the LPWAN Server uplink endpoint', async () => {
        const res = await send(
          server.post(`/api/ingest/${lora2AppId}/${Lora2.network.id}`),
          { msgId: 2 }
        )
        res.should.have.status(204)
      })
      it('Ensure app server received message', async () => {
        try {
          await rcServer.listRequests({
            method: 'POST',
            path: '/uplinks',
            body: { msgId: 1 }
          })
        }
        catch (err) {
          err.statusCode.should.equal(404)
        }
      })
    })
  })
})
