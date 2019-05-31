let chai = require('chai')
let chaiHttp = require('chai-http')
let createApp = require('../../../restApp')
const createRcServer = require('../../lib/rc-server')
const { prisma } = require('../../../prisma/generated/prisma-client')
const path = require('path')
const fs = require('fs')

var should = chai.should()
chai.use(chaiHttp)
let server
let rcServer

const certFile = path.join(__dirname, '../../../certs/client-catm1-crt.pem')
const keyFile = path.join(__dirname, '../../../certs/client-catm1-key.pem')
const caFile = path.join(__dirname, '../../../certs/ca-crt.pem')
const appServerUplinkUrl = `http://e2e-test:${process.env.APP_SERVER_PORT}/uplinks`

const send = (request, data) => request
  // .set('Authorization', 'Bearer ' + adminToken)
  .set('Content-Type', 'application/json')
  .send(data)

describe.only('E2E Test for IP Device Uplink/Downlink Device Messaging', () => {
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
      baseUrl: appServerUplinkUrl,
      enabled: true,
      reportingProtocol: { connect: { id: postReportingProtocol.id } }
    })
    let device = await prisma.createDevice({
      name: 'ip-msg-test-dvc',
      application: { connect: { id: application.id } }
    })
    let deviceNTL = await prisma.createDeviceNetworkTypeLink({
      networkType: { connect: { id: ipNwkType.id } },
      device: { connect: { id: device.id } },
      deviceProfile: { connect: { id: deviceProfile.id } },
      networkSettings: '{"devEUI":"00:11:22:33:44:55:66:77"}'
    })
  }

  before(async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    await setupData()
    rcServer = await createRcServer({
      port: process.env.APP_SERVER_PORT,
      maxRequestAge: 5000
    })
  })

  it('Sends uplink message to IP uplink endpoint', async () => {
    const key = fs.readFileSync(keyFile)
    const cert = fs.readFileSync(certFile)
    const ca = fs.readFileSync(caFile)
    const res = await send(
      server.post(`/api/ingest/ip-device`).key(key).cert(cert).ca(ca),
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
