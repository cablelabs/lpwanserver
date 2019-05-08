let chai = require('chai')
let chaiHttp = require('chai-http')
let app = require('../../../restApp.js')
let setup = require('../setup.js')
const { assertEqualProps } = require('../../lib/helpers')
const Lora2 = require('../networks/lora-v2')
const createRcServer = require('../../lib/rc-server')

var should = chai.should()
chai.use(chaiHttp)
let server = chai.request(app).keepOpen()

describe('E2E Test for Uplink/Downlink Device Messaging', () => {
  let adminToken = ''
  let rcServer
  let lora2AppId = ''

  const APP_SERVER_UPLINK_URL = `http://e2e-test:${process.env.APP_SERVER_PORT}/uplinks`

  before(async () => {
    await setup.start()
    rcServer = await createRcServer({
      port: process.env.APP_SERVER_PORT,
      maxRequestAge: 5000
    })
  })

  it('Admin Login to LPWan Server', (done) => {
    server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) done(err)
        res.should.have.status(200)
        adminToken = res.text
        done()
      })
  })

  describe('Update the application baseUrls', () => {
    it('List LPWAN Server applications', async () => {
      const res = await server
        .get('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
      res.should.have.status(200)
      let { records } = JSON.parse(res.text)
      const app = records.find(x => x.name === Lora2.application.name)
      should.exist(app)
      lora2AppId = app.id
    })
    it('Update the baseUrl of the app that originated on LoRa Server v2', async () => {
      const res = await server
        .put('/api/applications/' + lora2AppId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ baseUrl: APP_SERVER_UPLINK_URL })
      res.should.have.status(204)
    })
    it('Start application', async () => {
      const res = await server
        .post(`/api/applications/${lora2AppId}/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send()
      res.should.have.status(200)
    })
    it('Post an uplink message to the LPWAN Server uplink endpoint', async () => {
      const res = await server
        .post(`/api/uplink/${lora2AppId}/${Lora2.network.id}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ msgId: 1 })
      res.should.have.status(204)
    })
    it('Ensure app server received message', async () => {
      await rcServer.listRequests({
        method: 'POST',
        path: '/uplinks',
        body: { msgId: 1 }
      })
    })
    it('Stop application', async () => {
      const res = await server
        .post(`/api/applications/${lora2AppId}/stop`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send()
      res.should.have.status(200)
    })
    it('Post an uplink message to the LPWAN Server uplink endpoint', async () => {
      const res = await server
        .post(`/api/uplink/${lora2AppId}/${Lora2.network.id}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ msgId: 2 })
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
