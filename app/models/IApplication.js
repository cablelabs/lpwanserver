const { logger } = require('../log')
const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess.js')
const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const R = require('ramda')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')
const { createModel, create, list, load } = require('./Model')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicApplication on Application {
    id
    name
    description
    enabled
  }`,
  id: `fragment ApplicationId on Application {
    id
  }`
}

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'application',
    pluralName: 'applications',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// ******************************************************************************
// Model API
// ******************************************************************************
async function update (ctx, args) {
  if (!args.where) throw httpError(400, 'Missing record identifier "where"')
  let oldRec = await ctx.DB.load({ where: args.where })
  const result = await ctx.DB.update(args)
  if ('enabled' in args.data && args.data.enabled !== oldRec.enabled) {
    await this[args.data.enabled ? 'start' : 'stop'](ctx, oldRec.id)
  }
  return result
}

async function remove (ctx, id) {
  try {
    for await (let state of ctx.$models.devices.removeMany({ where: { application: { id } } })) {
      // state can be analyzed here to see what was just removed and how many remain
    }
  }
  catch (err) {
    logger.error('Error deleting application\'s devices', err)
    throw err
  }

  try {
    for await (let state of ctx.$models.applicationNetworkTypeLinks.removeMany({ where: { application: { id } } })) {
      // state can be analyzed here to see what was just removed and how many remain
    }
  }
  catch (err) {
    logger.error('Error deleting application\'s networkTypeLinks', err)
    throw err
  }

  // TODO: stop application if it's enabled
  await ctx.DB.remove(id)
}

async function startApplication (ctx, id) {
  // Ensure app has a ReportingProtocol
  const [reportingProtocols] = await ctx.$models.applicationReportingProtocols.list({
    where: { application: { id } }
  })
  if (!reportingProtocols.length) {
    throw httpError(400, 'Application must have a ReportingProtocol to be enabled.')
  }
  // Call startApplication on NetworkTypes
  let [ records ] = await ctx.$models.applicationNetworkTypeLinks.list({ where: { application: { id } } })
  const logs = await Promise.all(records.map(x => ctx.$models.networkTypeAPI.startApplication({
    networkTypeId: x.networkType.id,
    applicationId: id
  })))
  return R.flatten(logs)
}

async function stopApplication (ctx, id) {
  // Call stopApplication on NetworkTypes
  let [ records ] = await ctx.$models.applicationNetworkTypeLinks.list({ where: { application: { id } } })
  const logs = await Promise.all(records.map(x => ctx.$models.networkTypeAPI.stopApplication({
    networkTypeId: x.networkType.id,
    applicationId: id
  })))
  return R.flatten(logs)
}

async function passDataToApplication (ctx, { id, networkId, data }) {
  // Ensure application is running
  const app = await ctx.DB.load({ where: { id } })
  if (!app.enabled) return
  // Ensure network is enabled
  const network = await ctx.$models.networks.load({ where: { id: networkId } })
  if (!network.securityData.enabled) return
  // Ensure applicationNetworkTypeLink exists
  let [ records ] = await ctx.$models.applicationNetworkTypeLinks.list({ where: {
    application: { id },
    networkType: { id: network.networkType.id },
    limit: 1
  } })
  if (!records.length) return
  // Pass data
  let proto = await ctx.$models.networkProtocolAPI.getProtocol(network)
  let dataAPI = new NetworkProtocolDataAccess(ctx.$models, 'ReportingProtocol')
  await proto.passDataToApplication(network, id, data, dataAPI)
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    create,
    list,
    load,
    update,
    remove,
    passDataToApplication
  }
)

module.exports = {
  model,
  update,
  remove,
  startApplication,
  stopApplication,
  passDataToApplication
}
