const { prisma } = require('../../../prisma/generated/prisma-client')

async function setupData ({ appBaseUrl }) {
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
    baseUrl: appBaseUrl,
    enabled: true,
    reportingProtocol: { connect: { id: postReportingProtocol.id } }
  })
  const device = await prisma.createDevice({
    name: 'ip-msg-test-dvc',
    application: { connect: { id: application.id } }
  })
  const deviceNtl = await prisma.createDeviceNetworkTypeLink({
    networkType: { connect: { id: ipNwkType.id } },
    device: { connect: { id: device.id } },
    deviceProfile: { connect: { id: deviceProfile.id } },
    networkSettings: '{"devEUI":"0011223344556677"}'
  })

  return {
    ipNwkType,
    postReportingProtocol,
    company,
    deviceProfile,
    application,
    device,
    deviceNtl
  }
}

module.exports = {
  setupData
}
