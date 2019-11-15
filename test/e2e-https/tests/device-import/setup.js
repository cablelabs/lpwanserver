const { prisma } = require('../../../../app/generated/prisma-client')

async function setupData () {
  let ipNwkType = await prisma.networkType({ name: 'IP' })
  let postReportingProtocol = (await prisma.reportingProtocols())[0]
  let deviceProfile = await prisma.createDeviceProfile({
    networkType: { connect: { id: ipNwkType.id } },
    name: 'device-import-test-dev-prof'
  })
  let application = await prisma.createApplication({
    name: 'device-import-test-app',
    reportingProtocol: { connect: { id: postReportingProtocol.id } }
  })

  return {
    ipNwkType,
    postReportingProtocol,
    deviceProfile,
    application
  }
}

module.exports = {
  setupData
}
