const path = require('path')
const { renameKeys } = require('../../lib/utils')
const registerNetworkProtocols = require('../../networkProtocols/register')
const { load, update, remove } = require('../model-lib')
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
    ctx.handlers[x.id] = new Handler({ modelAPI: ctx.$m, networkProtocolId: x.id })
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

async function upsert (ctx, { data: { networkProtocolVersion, name, ...np } }) {
  const [nps] = await ctx.$self.list({ where: { search: name, networkProtocolVersion }, limit: 1 })
  if (nps.length) {
    return ctx.$self.update({ where: { id: nps[0].id }, data: np })
  }
  return ctx.$self.create({ data: { ...np, networkProtocolVersion, name } })
}

function getHandler (ctx, { id }) {
  return ctx.handlers[id]
}

// ******************************************************************************
// Network Protocol Handler API
// ******************************************************************************
const handlerCommand = command => async (ctx, args) => {
  const handler = ctx.$self.getHandler(args.network.networkProtocol)
  await handler[command](args)
}

async function test (ctx, { network }) {
  if (!network.securityData.authorized) {
    throw httpError.Unauthorized()
  }
  const handler = ctx.$self.getHandler(network.networkProtocol)
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
  const handler = ctx.$self.getHandler(network.networkProtocol)
  const remoteApps = await handler.listAllApplications(network)
  const postReportingProtocol = await ctx.$m.reportingProtocols.load({ where: { name: 'POST' } })
  return Promise.all(remoteApps.map(async remoteApp => {
    const origin = { network, remoteId: remoteApp.id }
    const { application: appData, networkSettings } = await handler.buildApplication(network, remoteApp)
    if (appData.baseUrl) {
      // if appData.baseUrl includes the network ID, the app is already activated
      // delete baseUrl so that it doesn't overwrite link to application server
      if (appData.baseUrl.includes(network.id)) delete appData.baseUrl
      else appData.reportingProtocol = { id: postReportingProtocol.id }
    }
    const application = await ctx.$m.application.upsert({ data: appData, origin })
    const appNtlData = {
      networkSettings,
      networkType: network.networkType,
      application: { id: application.id }
    }
    if (appData.baseUrl) appNtlData.enabled = true
    const applicationNetworkTypeLink = await ctx.$m.applicationNetworkTypeLink.upsert({
      origin,
      data: appNtlData
    })
    return { application, applicationNetworkTypeLink, remoteApp }
  }))
}

async function pullDeviceProfiles (ctx, { network }) {
  const handler = ctx.$self.getHandler(network.networkProtocol)
  const remoteDeviceProfiles = await handler.listAllDeviceProfiles(network)
  return Promise.all(remoteDeviceProfiles.map(async remoteDeviceProfile => {
    const origin = { network, remoteId: remoteDeviceProfile.id }
    const data = await handler.buildDeviceProfile(network, remoteDeviceProfile)
    const deviceProfile = await ctx.$.m.deviceProfile.upsert({
      origin,
      data: {
        ...data,
        name: remoteDeviceProfile.name || data.name,
        networkType: network.networkType
      }
    })
    return { deviceProfile, remoteDeviceProfile }
  }))
}

async function pullDevices (ctx, { network, application, remoteApp, deviceProfiles }) {
  const handler = ctx.$self.getHandler(network.networkProtocol)
  const remoteDevices = await handler.listAllApplicationDevices(network, remoteApp)
  return Promise.all(remoteDevices.map(async remoteDevice => {
    const origin = { network, remoteId: remoteDevice.id }
    const { deviceProfile } = deviceProfiles.find(x => x.remoteDeviceProfile.id === remoteDevice.deviceProfileID) || {}
    const { device: devData, networkSettings } = await handler.buildDevice(network, remoteDevice, deviceProfile)
    devData.applicationId = application.id
    const device = await ctx.$m.device.upsert({
      origin,
      data: devData
    })
    let devNtlData = {
      networkSettings,
      deviceId: device.id,
      networkTypeId: network.networkType.id
    }
    if (deviceProfile) {
      devNtlData.deviceProfileId = deviceProfile.id
    }
    const deviceNetworkTypeLink = await ctx.$m.deviceNetworkTypeLink.upsert({
      origin,
      data: devNtlData
    })
    return { device, deviceNetworkTypeLink }
  }))
}

async function pushNetwork (ctx, { network }) {
  await Promise.all([
    ctx.$self.pushApplications({ network }),
    ctx.$self.pushDeviceProfiles({ network })
  ])
  await ctx.$self.pushDevices({ network })
}

async function pushApplications (ctx, { network }) {
  const [appNtls, nwkDeployments] = await Promise.all([
    ctx.$m.applicationNetworkTypeLink.list({
      where: { networkType: network.networkType },
      limit: 9999
    }),
    ctx.$m.networkDeployment.list({
      where: { network: { id: network.id }, type: 'APPLICATION' },
      limit: 9999
    })
  ])
  const notDeployed = appNtls.filter(x => !nwkDeployments.find(y => y.application.id === x.application.id))
  return Promise.all(notDeployed.map(appNtl => ctx.$m.networkProtocol.create({
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
  const [deviceProfiles, nwkDeployments] = await Promise.all([
    ctx.$m.deviceProfile.list({
      where: { networkType: network.networkType },
      limit: 9999
    }),
    ctx.$m.networkDeployment.list({
      where: { network: { id: network.id }, type: 'DEVICE_PROFILE' },
      limit: 9999
    })
  ])
  const notDeployed = deviceProfiles.filter(x => !nwkDeployments.find(y => y.deviceProfile.id === x.id))
  return Promise.all(notDeployed.map(devProfile => ctx.$m.networkProtocol.create({
    data: {
      status: 'CREATED',
      type: 'DEVICE_PROFILE',
      meta: {},
      network: { id: network.id },
      deviceProfile: devProfile.id
    }
  })))
}

async function pushDevices (ctx, { network }) {
  const [devNtls, nwkDeployments] = await Promise.all([
    ctx.$m.deviceNetworkTypeLink.list({
      where: { networkType: network.networkType },
      limit: 9999
    }),
    ctx.$m.networkDeployment.list({
      where: { network: { id: network.id }, type: 'DEVICE' },
      limit: 9999
    })
  ])
  const notDeployed = devNtls.filter(x => !nwkDeployments.find(y => y.device.id === x.device.id))
  return Promise.all(notDeployed.map(devNtl => ctx.$m.networkProtocol.create({
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
  const handler = ctx.$self.getHandler({ id: network.networkProtocol.id })
  let [applicationNetworkTypeLink, application] = networkDeployment.status === 'REMOVED'
    ? []
    : await Promise.all([
      ctx.$m.applicationNetworkTypeLink.loadByQuery({
        where: { networkType: network.networkType, application: networkDeployment.application }
      }),
      ctx.$m.application.load({ where: networkDeployment.application })
    ])
  const args = { network, networkDeployment, application, applicationNetworkTypeLink }
  const remoteDoc = await handler.syncApplication(args)
  let meta = { ...networkDeployment.meta }
  if (networkDeployment.status === 'CREATED') {
    meta = { id: remoteDoc.id }
  }
  const { enabled } = applicationNetworkTypeLink
  if (networkDeployment.meta.enabled !== enabled) {
    await ctx.$self[enabled ? 'startApplication' : 'stopApplication']({ network, applicationId: application.id })
    meta.enabled = enabled
  }
  return meta
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
    syncApplication,
    pushApplication: handlerCommand('pushApplication'),
    pullApplication: handlerCommand('pullApplication'),
    addApplication: handlerCommand('addApplication'),
    deleteApplication: handlerCommand('deleteApplication'),
    startApplication: handlerCommand('startApplication'),
    stopApplication: handlerCommand('stopApplication'),
    addDevice: handlerCommand('addDevice'),
    deleteDevice: handlerCommand('deleteDevice'),
    pushDevice: handlerCommand('pushDevice'),
    pullDevice: handlerCommand('pullDevice'),
    addDeviceProfile: handlerCommand('addDeviceProfile'),
    deleteDeviceProfile: handlerCommand('deleteDeviceProfile'),
    pushDeviceProfile: handlerCommand('pushDeviceProfile'),
    pullDeviceProfile: handlerCommand('pullDeviceProfile'),
    passDataToDevicea: handlerCommand('passDataToDevice')
  },
  fragments
}
