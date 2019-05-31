const createRcServer = require('./rc-server')
const request = require('request-promise')
const fs = require('fs')
const path = require('path')
const { prisma } = require('../../prisma/generated/prisma-client')

const certFile = path.join(__dirname, '../../certs/client-catm1-crt.pem')
const keyFile = path.join(__dirname, '../../certs/client-catm1-key.pem')
const caFile = path.join(__dirname, '../../certs/ca-crt.pem')

let ipNwkType
let postReportingProtocol
let company
let deviceProfile
let application
let device
let deviceNTL

async function setupData () {
  ipNwkType = await prisma.networkType({ name: 'IP' })
  postReportingProtocol = (await prisma.reportingProtocols())[0]
  company = (await prisma.companies())[0]
  deviceProfile = await prisma.createDeviceProfile({
    company: { connect: { id: company.id } },
    networkType: { connect: { id: ipNwkType.id } },
    name: 'ip-msg-test-dev-prof',
    networkSettings: '{}'
  })
  application = await prisma.createApplication({
    name: 'ip-msg-test-app',
    baseUrl: 'http://localhost:3000/uplink',
    enabled: true,
    reportingProtocol: { connect: { id: postReportingProtocol.id } }
  })
  device = await prisma.createDevice({
    name: 'ip-msg-test-dvc',
    application: { connect: { id: application.id } }
  })
  deviceNTL = await prisma.createDeviceNetworkTypeLink({
    networkType: { connect: { id: ipNwkType.id } },
    device: { connect: { id: device.id } },
    deviceProfile: { connect: { id: deviceProfile.id } },
    networkSettings: '{"devEUI":"00:11:22:33:44:55:66:77"}'
  })
}

async function main () {
  await setupData()

  const rcServer = await createRcServer({
    port: 3000,
    maxRequestAge: 5000
  })

  const opts = {
    method: 'post',
    url: 'https://localhost:3200/api/ingest/ip-device',
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
    ca: fs.readFileSync(caFile),
    json: true,
    body: { msg: 'Testing 1,2,3' }
  }

  let body = await request(opts)
  console.log(body)

  let requests = await rcServer.listRequests({ method: 'POST' })
  console.log(requests)
}

main().catch(e => console.error(e))
