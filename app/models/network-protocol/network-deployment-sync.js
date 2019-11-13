const R = require('ramda')
const { joinUrl } = require('../../lib/utils')

const nameDesc = ['name', 'description']

async function syncApplication (ctx, { network, networkDeployment }) {
  const handler = await ctx.$self.getHandler({ id: network.networkProtocol.id })
  let meta = { ...networkDeployment.meta }
  if (networkDeployment.status === 'REMOVED') {
    if (meta.isOrigin) return
    return handler.removeApplication({ network, remoteId: meta.remoteId, stopApplication: meta.enabled })
  }
  const [application, applicationNetworkTypeLink] = await Promise.all([
    ctx.$m.application.load({ where: networkDeployment.application }),
    ctx.$m.applicationNetworkTypeLink.loadByQuery({
      where: { networkType: network.networkType, application: networkDeployment.application }
    })
  ])
  let args = {
    network,
    remoteId: meta.remoteId,
    application: {
      ...R.pick(nameDesc, application),
      ...applicationNetworkTypeLink.networkSettings
    }
  }
  if (networkDeployment.status === 'CREATED' && !meta.isOrigin) {
    let remoteDoc = await handler.createApplication(args)
    meta.remoteId = remoteDoc.id
    networkDeployment = { ...networkDeployment, meta }
  }
  else if (networkDeployment.status === 'UPDATED') {
    await handler.updateApplication(args)
  }
  const { enabled } = applicationNetworkTypeLink
  if (networkDeployment.meta.enabled !== enabled) {
    if (enabled) {
      const url = joinUrl(ctx.config.base_url, 'api/uplinks', application.id, network.id)
      await handler.startApplication({ network, networkDeployment, url })
    }
    else {
      await handler.stopApplication({ network, networkDeployment })
    }
    meta.enabled = enabled
  }
  return meta
}

async function syncDeviceProfile (ctx, { network, networkDeployment }) {
  let meta = { ...networkDeployment.meta }
  if (networkDeployment.status === 'CREATED' && meta.isOrigin) {
    return meta
  }
  const handler = await ctx.$self.getHandler({ id: network.networkProtocol.id })
  if (networkDeployment.status === 'REMOVED') {
    if (meta.isOrigin) return
    return handler.removeDeviceProfile({ network, remoteId: meta.remoteId })
  }
  const deviceProfile = await ctx.$m.deviceProfile.load({ where: networkDeployment.deviceProfile })
  let args = {
    network,
    remoteId: meta.remoteId,
    deviceProfile: {
      ...R.pick(nameDesc, deviceProfile),
      ...deviceProfile.networkSettings
    }
  }
  if (networkDeployment.status === 'CREATED') {
    let remoteDoc = await handler.createDeviceProfile(args)
    meta.remoteId = remoteDoc.id
  }
  else if (networkDeployment.status === 'UPDATED') {
    await handler.updateDeviceProfile(args)
  }
  return meta
}

async function syncDevice (ctx, { network, networkDeployment }) {
  const handler = await ctx.$self.getHandler({ id: network.networkProtocol.id })
  let meta = { ...networkDeployment.meta }
  if (networkDeployment.status === 'REMOVED') {
    if (meta.isOrigin) return
    return handler.removeDevice({ network, remoteId: meta.remoteId })
  }
  const [device, deviceNetworkTypeLink] = await Promise.all([
    ctx.$m.device.load({ where: networkDeployment.device }),
    ctx.$m.deviceNetworkTypeLink.loadByQuery({
      where: { networkType: network.networkType, device: networkDeployment.device }
    })
  ])
  const [appNwkDep, dpNwkDep, deviceProfile] = await Promise.all([
    ctx.$m.networkDeployment.loadByQuery({
      where: { network: { id: network.id }, application: device.application }
    }),
    ctx.$m.networkDeployment.loadByQuery({
      where: { network: { id: network.id }, deviceProfile: deviceNetworkTypeLink.deviceProfile }
    }),
    ctx.$m.deviceProfile.load({ where: deviceNetworkTypeLink.deviceProfile })
  ])
  let args = {
    network,
    remoteId: meta.remoteId,
    remoteApplicationId: appNwkDep.meta.remoteId,
    remoteDeviceProfileId: dpNwkDep.meta.remoteId,
    deviceProfile: {
      ...R.pick(nameDesc, deviceProfile),
      ...deviceProfile.networkSettings
    },
    device: {
      ...R.pick(nameDesc, device),
      ...deviceNetworkTypeLink.networkSettings
    }
  }
  if (networkDeployment.status === 'CREATED' && !meta.isOrigin) {
    ctx.log.debug('syncDevice', R.pick(['device', 'deviceProfile'], args))
    let remoteDoc = await handler.createDevice(args)
    meta.remoteId = remoteDoc.id
  }
  else if (networkDeployment.status === 'UPDATED') {
    await handler.updateDevice(args)
  }
  return meta
}


module.exports = {
  syncApplication,
  syncDeviceProfile,
  syncDevice
}
