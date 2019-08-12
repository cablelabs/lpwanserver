const { prisma } = require('../../../../app/generated/prisma-client')

async function setupData () {
  const cos = await prisma.companies()
  let ipNwkType = await prisma.networkType({ name: 'IP' })
  let postReportingProtocol = (await prisma.reportingProtocols())[0]
  let company = (await prisma.companies())[0]
  let deviceProfile = await prisma.createDeviceProfile({
    company: { connect: { id: company.id } },
    networkType: { connect: { id: ipNwkType.id } },
    name: 'device-import-test-dev-prof',
    networkSettings: `{}`
  })
  let application = await prisma.createApplication({
    name: 'device-import-test-app',
    enabled: false,
    reportingProtocol: { connect: { id: postReportingProtocol.id } },
    company: { connect: { id: cos[0].id } }
  })

  return {
    ipNwkType,
    postReportingProtocol,
    company,
    deviceProfile,
    application
  }
}

module.exports = {
  setupData
}
