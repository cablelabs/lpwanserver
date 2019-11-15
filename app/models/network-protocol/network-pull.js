const R = require('ramda')

const nameDesc = ['name', 'description']

async function pullNetwork (ctx, { network }) {
  const [apps, deviceProfiles] = await Promise.all([
    ctx.$self.pullApplications({ network }),
    ctx.$self.pullDeviceProfiles({ network })
  ])
  await Promise.all(apps.map(app => ctx.$self.pullApplicationDevices({ network, ...app, deviceProfiles })))
}

async function pullApplications (ctx, { network }) {
  const handler = await ctx.$self.getHandler(network.networkProtocol)
  const remoteApps = await handler.listAllApplications({ network })
  return Promise.all(remoteApps.map(async remoteApplication => {
    const appData = await handler.buildApplication({ network, remoteApplication })
    const origin = { network, remoteId: appData.id }
    if (appData.baseUrl) {
      // if appData.baseUrl includes the network ID, the app is already activated
      // delete baseUrl so that it doesn't overwrite link to application server
      if (appData.baseUrl.includes(network.id)) {
        delete appData.baseUrl
      }
      else {
        const postReportingProtocol = await ctx.$m.reportingProtocol.load({ where: { name: 'POST' } })
        appData.reportingProtocol = { id: postReportingProtocol.id }
      }
    }
    const application = await ctx.$m.application.upsert({
      data: R.pick([...nameDesc, 'baseUrl', 'reportingProtocol'], appData),
      origin
    })
    const appNtlData = {
      networkSettings: R.omit([...nameDesc, 'id', 'baseUrl', 'reportingProtocol'], appData),
      networkType: network.networkType,
      application: { id: application.id }
    }
    if (appData.baseUrl) appNtlData.enabled = true
    const applicationNetworkTypeLink = await ctx.$m.applicationNetworkTypeLink.upsert({
      origin,
      data: appNtlData
    })
    return { application, applicationNetworkTypeLink, remoteApplication }
  }))
}

async function pullDeviceProfiles (ctx, { network }) {
  const handler = await ctx.$self.getHandler(network.networkProtocol)
  const remoteDeviceProfiles = await handler.listAllDeviceProfiles({ network })
  return Promise.all(remoteDeviceProfiles.map(async remoteDeviceProfile => {
    const dpData = await handler.buildDeviceProfile({ network, remoteDeviceProfile })
    const origin = { network, remoteId: dpData.id }
    const deviceProfile = await ctx.$m.deviceProfile.upsert({
      origin,
      data: {
        ...R.pick(nameDesc, dpData),
        networkSettings: R.omit([...nameDesc, 'id'], dpData),
        networkType: network.networkType
      }
    })
    return { deviceProfile, remoteDeviceProfile }
  }))
}

async function pullApplicationDevices (ctx, { network, application, remoteApplication, deviceProfiles }) {
  ctx.log.debug('pullApplicationDevices', { application })
  const handler = await ctx.$self.getHandler(network.networkProtocol)
  const remoteDevices = await handler.listAllApplicationDevices({ network, remoteApplication })
  return Promise.all(remoteDevices.map(async remoteDevice => {
    const { deviceProfile } = deviceProfiles.find(x => x.remoteDeviceProfile.id === remoteDevice.deviceProfileID) || {}
    const devData = await handler.buildDevice({
      network,
      remoteDevice,
      deviceProfile: deviceProfile.networkSettings
    })
    const origin = { network, remoteId: devData.id }
    const device = await ctx.$m.device.upsert({
      origin,
      data: { ...R.pick(nameDesc, devData), applicationId: application.id }
    })
    let devNtlData = {
      networkSettings: R.omit([...nameDesc, 'id'], devData),
      device: { id: device.id },
      networkType: { id: network.networkType.id }
    }
    if (deviceProfile) {
      devNtlData.deviceProfile = { id: deviceProfile.id }
    }
    const deviceNetworkTypeLink = await ctx.$m.deviceNetworkTypeLink.upsert({
      origin,
      data: devNtlData
    })
    return { device, deviceNetworkTypeLink }
  }))
}

module.exports = {
  pullNetwork,
  pullApplications,
  pullDeviceProfiles,
  pullApplicationDevices
}
