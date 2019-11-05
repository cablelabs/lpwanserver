const { prisma } = require('../../../../app/generated/prisma-client')

async function setupData ({ appBaseUrl }) {
  let ipNwkType = await prisma.networkType({ name: 'IP' })
  let postReportingProtocol = (await prisma.reportingProtocols())[0]
  let deviceProfile = await prisma.createDeviceProfile({
    networkType: { connect: { id: ipNwkType.id } },
    name: 'ip-msg-test-dev-prof'
  })
  let application = await prisma.createApplication({
    name: 'ip-msg-test-app',
    baseUrl: appBaseUrl,
    reportingProtocol: { connect: { id: postReportingProtocol.id } }
  })
  await prisma.createApplicationNetworkTypeLink({
    application: { connect: { id: application.id } },
    networkType: { connect: { id: ipNwkType.id } },
    enabled: true
  })
  const device = await prisma.createDevice({
    name: 'ip-msg-test-dvc',
    application: { connect: { id: application.id } }
  })
  const deviceNtl = await prisma.createDeviceNetworkTypeLink({
    networkType: { connect: { id: ipNwkType.id } },
    device: { connect: { id: device.id } },
    deviceProfile: { connect: { id: deviceProfile.id } },
    enabled: true,
    networkSettings: '{ "devEUI": "0011223344556677" }'
  })

  return {
    ipNwkType,
    postReportingProtocol,
    deviceProfile,
    application,
    device,
    deviceNtl
  }
}

module.exports = {
  setupData
}
