const httpError = require('http-errors')
const R = require('ramda')
const { create, list, load } = require('../model-lib')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicApplication on Application {
    id
    name
    description
    enabled
    baseUrl
    reportingProtocol {
      id
    }
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function update (ctx, args) {
  if (!args.where) throw httpError(400, 'Missing record identifier "where"')
  let oldRec = await ctx.db.load({ where: args.where })
  const result = await ctx.db.update(args)
  if ('enabled' in args.data && args.data.enabled !== oldRec.enabled) {
    await ctx.$self[args.data.enabled ? 'start' : 'stop'](oldRec.id)
  }
  return result
}

async function remove (ctx, id) {
  // remove all Application Devices
  try {
    for await (let state of ctx.$m.devices.removeMany({ where: { application: { id } } })) {
      // state can be analyzed here to see what was just removed and how many remain
    }
  }
  catch (err) {
    ctx.log.error('Error deleting application\'s devices', err)
    throw err
  }
  // remove all ApplicationNetworkTypeLinks
  try {
    for await (let state of ctx.$m.applicationNetworkTypeLinks.removeMany({ where: { application: { id } } })) {
      // state can be analyzed here to see what was just removed and how many remain
    }
  }
  catch (err) {
    ctx.log.error('Error deleting application\'s networkTypeLinks', err)
    throw err
  }
  // TODO: stop application if it's enabled
  await ctx.db.remove(id)
}

async function start (ctx, id) {
  // Ensure app has a ReportingProtocol
  const [reportingProtocols] = await ctx.$m.applicationReportingProtocols.list({
    where: { application: { id } }
  })
  if (!reportingProtocols.length) {
    throw httpError(400, 'Application must have a ReportingProtocol to be enabled.')
  }
  // Call startApplication on NetworkTypes
  let [appNtls] = await ctx.$m.applicationNetworkTypeLinks.list({ where: { application: { id } } })
  let logs = await Promise.all(appNtls.map(
    appNtl => ctx.$.m.networkTypes.forAllNetworks({
      networkTypeId: appNtl.networkType.id,
      op: network => ctx.$m.networkProtocols.startApplication({ network, applicationId: id })
    })
  ))
  return R.flatten(logs)
}

async function stop (ctx, id) {
  // Call stopApplication on NetworkTypes
  let [appNtls] = await ctx.$m.applicationNetworkTypeLinks.list({ where: { application: { id } } })
  let logs = await Promise.all(appNtls.map(
    appNtl => ctx.$.m.networkTypes.forAllNetworks({
      networkTypeId: appNtl.networkType.id,
      op: network => ctx.$m.networkProtocols.stopApplication({ network, applicationId: id })
    })
  ))
  return R.flatten(logs)
}

async function passDataToApplication (ctx, { id, networkId, data }) {
  // Ensure application is running
  const app = await ctx.db.load({ where: { id } })
  if (!app.enabled) return
  // Ensure network is enabled
  const network = await ctx.$m.networks.load({ where: { id: networkId } })
  if (!network.securityData.enabled) return
  // Ensure applicationNetworkTypeLink exists
  let [appNtls] = await ctx.$m.applicationNetworkTypeLinks.list({ where: {
    application: { id },
    networkType: { id: network.networkType.id },
    limit: 1
  } })
  if (!appNtls.length) return
  // Pass data
  await ctx.$m.networkProtocols.passDataToApplication({ network, applicationId: id, data })
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  api: {
    create,
    list,
    load,
    update,
    remove,
    passDataToApplication,
    start,
    stop
  },
  fragments
}
