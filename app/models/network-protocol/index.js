const path = require('path')
const { renameKeys, joinUrl, getUpdates } = require('../../lib/utils')
const registerNetworkProtocols = require('../../networkProtocols/register')
const { load, update, remove, loadByQuery } = require('../model-lib')
const httpError = require('http-errors')
const R = require('ramda')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkProtocol on NetworkProtocol {
    id
    name
    networkProtocolVersion
    protocolHandler
    networkType {
      id
    }
    masterProtocol {
      id
    }
  }`
}

const nameDesc = ['name', 'description']

// ******************************************************************************
// Helpers
// ******************************************************************************
const handlerDir = path.join(__dirname, '../../networkProtocols/handlers')

function addMetadata (rec) {
  return {
    ...rec,
    metaData: require(path.join(handlerDir, rec.protocolHandler, 'metadata'))
  }
}
const renameQueryKeys = renameKeys({
  search: 'name_contains',
  networkProtocolVersion: 'networkProtocolVersion_contains'
})

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function initialize (ctx) {
  await registerNetworkProtocols(ctx.$m)
  const [ records ] = await ctx.db.list()
  const handlersDir = path.join(__dirname, '../../networkProtocols/handlers')
  records.forEach(x => {
    let Handler = require(path.join(handlersDir, x.protocolHandler))
    let handler = new Handler({ modelAPI: ctx.$m, networkProtocolId: x.id })
    ctx.handlers[x.id] = handler
    handler.on('uplink', ({ id, args }) => {
      ctx.$m.application.passDataToApplication(args).then(
        x => handler.emit(`uplink:ok:${id}`, x),
        err => handler.emit(`uplink:fail:${id}`, err)
      )
    })
  })
}

async function create (ctx, { data }) {
  let rec = await ctx.db.create({ data })
  if (!data.masterProtocol) {
    rec = await ctx.db.update({
      where: { id: rec.id },
      data: { masterProtocol: { id: rec.id } }
    })
  }
  return rec
}

async function list (ctx, { where = {}, ...opts }) {
  let [records, totalCount] = await ctx.db.list({ where: renameQueryKeys(where), ...opts })
  return [records.map(addMetadata), totalCount]
}

async function upsert (ctx, { data }) {
  const { networkProtocolVersion, name } = data
  try {
    const rec = await ctx.$self.loadByQuery({ where: { name, networkProtocolVersion } })
    data = getUpdates(rec, data)
    return ctx.$self.update({ where: { id: rec.id }, data })
  }
  catch (err) {
    if (err.statusCode === 404) return ctx.$self.create({ data })
    throw err
  }
}

async function getHandler (ctx, { id }) {
  return ctx.handlers[id]
}

// ******************************************************************************
// Network Protocol Handler API
// ******************************************************************************
const handlerCommand = command => async (ctx, args) => {
  const handler = await ctx.$self.getHandler(args.network.networkProtocol)
  return handler[command](args)
}

async function test (ctx, { network }) {
  if (!network.meta.authorized) {
    throw httpError.Unauthorized()
  }
  const handler = await ctx.$self.getHandler(network.networkProtocol)
  await handler.test({ network })
}

async function pullNetwork (ctx, { network }) {
  const [apps, deviceProfiles] = await Promise.all([
    ctx.$self.pullApplications({ network }),
    ctx.$self.pullDeviceProfiles({ network })
  ])
  await Promise.all(apps.map(app => ctx.$self.pullDevices({ network, ...app, deviceProfiles })))
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

async function pullDevices (ctx, { network, application, remoteApplication, deviceProfiles }) {
  ctx.log.debug('pullDevices', { application })
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

async function pushNetwork (ctx, { network }) {
  ctx.log.debug('networkProtocol:pushNetwork', { network })
  await Promise.all([
    ctx.$self.pushApplications({ network }),
    ctx.$self.pushDeviceProfiles({ network })
  ])
  await ctx.$self.pushDevices({ network })
}

async function pushApplications (ctx, { network }) {
  const [appNtls] = await ctx.$m.applicationNetworkTypeLink.list({
    where: { networkType: network.networkType },
    limit: 9999
  })
  const [nwkDeployments] = await ctx.$m.networkDeployment.list({
    where: { network: { id: network.id }, type: 'APPLICATION' },
    limit: 9999
  })
  const notDeployed = appNtls.filter(x => !nwkDeployments.find(y => y.application.id === x.application.id))
  return Promise.all(notDeployed.map(appNtl => ctx.$m.networkDeployment.create({
    data: {
      status: 'CREATED',
      type: 'APPLICATION',
      meta: { enabled: false },
      network: { id: network.id },
      application: appNtl.application
    }
  })))
}

async function pushDeviceProfiles (ctx, { network }) {
  const [deviceProfiles] = await ctx.$m.deviceProfile.list({
    where: { networkType: network.networkType },
    limit: 9999
  })
  const [nwkDeployments] = await ctx.$m.networkDeployment.list({
    where: { network: { id: network.id }, type: 'DEVICE_PROFILE' },
    limit: 9999
  })
  const notDeployed = deviceProfiles.filter(x => !nwkDeployments.find(y => y.deviceProfile.id === x.id))
  return Promise.all(notDeployed.map(devProfile => ctx.$m.networkDeployment.create({
    data: {
      status: 'CREATED',
      type: 'DEVICE_PROFILE',
      meta: {},
      network: { id: network.id },
      deviceProfile: { id: devProfile.id }
    }
  })))
}

async function pushDevices (ctx, { network }) {
  const [devNtls] = await ctx.$m.deviceNetworkTypeLink.list({
    where: { networkType: network.networkType },
    limit: 9999
  })
  const [nwkDeployments] = await ctx.$m.networkDeployment.list({
    where: { network: { id: network.id }, type: 'DEVICE' },
    limit: 9999
  })
  const notDeployed = devNtls.filter(x => !nwkDeployments.find(y => y.device.id === x.device.id))
  return Promise.all(notDeployed.map(devNtl => ctx.$m.networkDeployment.create({
    data: {
      status: 'CREATED',
      type: 'DEVICE',
      meta: {},
      network: { id: network.id },
      device: devNtl.device
    }
  })))
}

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

async function relayUplink (ctx, args) {
  const handler = await ctx.$self.getHandler(args.network.networkProtocol)
  await handler.handleUplink(args)
}

async function passDataToDevice (ctx, { network, deviceId, applicationId, data }) {
  const handler = await ctx.$self.getHandler(network.networkProtocol)
  if (!network.enabled) return
  const [applicationNetworkDeployment, deviceNetworkDeployment] = await Promise.all([
    ctx.$m.networkDeployment.loadByQuery({
      where: { network: { id: network.id }, application: { id: applicationId } }
    }),
    ctx.$m.networkDeployment.loadByQuery({
      where: { network: { id: network.id }, device: { id: deviceId } }
    })
  ])
  return handler.passDataToDevice({
    network,
    data,
    remoteApplicationId: applicationNetworkDeployment.meta.remoteId,
    remoteDeviceId: deviceNetworkDeployment.meta.remoteId
  })
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'networkProtocol',
  context: { handlers: {} },
  publicApi: {
    initialize,
    create,
    list,
    load,
    loadByQuery,
    update,
    upsert,
    remove,
    getHandler,
    connect: handlerCommand('connect'),
    disconnect: handlerCommand('disconnect'),
    test,
    pushNetwork,
    pullNetwork,
    pullApplications,
    pushApplications,
    pullDeviceProfiles,
    pushDeviceProfiles,
    pullDevices,
    pushDevices,
    relayUplink,
    syncApplication,
    syncDeviceProfile,
    syncDevice,
    passDataToDevice
  },
  fragments
}
