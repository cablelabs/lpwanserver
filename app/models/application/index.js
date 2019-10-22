const httpError = require('http-errors')
const R = require('ramda')
const { create, list, load } = require('../model-lib')
const { getUpdates } = require('../../lib/utils')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicApplication on Application {
    id
    name
    description
    baseUrl
    reportingProtocol {
      id
    }
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function update (ctx, { where, data, origin, ...args }) {
  if (!where) throw httpError(400, 'Missing record identifier "where"')
  const rec = await ctx.db.update({ where, data, ...args })
  // if certain props updated, set status on deployment record
  if (data.name || data.description || data.baseUrl) {
    const [appNwkTypeLinks] = await ctx.$m.applicationNetworkTypeLink.list({
      where: { application: { id: rec.id } }
    })
    await Promise.all(appNwkTypeLinks.map(appNwkTypeLink => {
      return ctx.$.m.networkTypes.forAllNetworks({
        networkTypeId: appNwkTypeLink.networkType.id,
        op: network => {
          if (origin && origin.network.id === network.id) return Promise.resolve()
          return ctx.$m.networkDeployment.updateByQuery({
            where: { network: { id: network.id }, application: { id: rec.id } },
            data: { status: 'UPDATED' }
          })
        }
      })
    }))
  }
  return rec
}

async function upsert (ctx, { data, ...args }) {
  let rec = await ctx.$self.load({ where: { name: data.name } })
  if (!rec) return ctx.$self.create({ ...args, data })
  data = getUpdates(rec, data)
  return R.empty(data) ? rec : ctx.$self.update({ ...args, where: { id: rec.id }, data })
}

async function remove (ctx, id) {
  // remove all ApplicationNetworkTypeLinks
  try {
    for await (let state of ctx.$m.applicationNetworkTypeLink.removeMany({ where: { application: { id } } })) {
      // state can be analyzed here to see what was just removed and how many remain
    }
  }
  catch (err) {
    ctx.log.error('Error deleting application\'s networkTypeLinks', err)
    throw err
  }
  // remove all Application Devices
  try {
    for await (let state of ctx.$m.device.removeMany({ where: { application: { id } } })) {
      // state can be analyzed here to see what was just removed and how many remain
    }
  }
  catch (err) {
    ctx.log.error('Error deleting application\'s devices', err)
    throw err
  }
  await ctx.db.remove(id)
}

// async function start (ctx, id) {
//   // Ensure app has a ReportingProtocol
//   const [reportingProtocols] = await ctx.$m.applicationReportingProtocols.list({
//     where: { application: { id } }
//   })
//   if (!reportingProtocols.length) {
//     throw httpError(400, 'Application must have a ReportingProtocol to be enabled.')
//   }
//   // Call startApplication on NetworkTypes
//   let [appNtls] = await ctx.$m.applicationNetworkTypeLink.list({ where: { application: { id } } })
//   let logs = await Promise.all(appNtls.map(
//     appNtl => ctx.$.m.networkTypes.forAllNetworks({
//       networkTypeId: appNtl.networkType.id,
//       op: network => ctx.$m.networkProtocol.startApplication({ network, applicationId: id })
//     })
//   ))
//   return R.flatten(logs)
// }

// async function stop (ctx, id) {
//   // Call stopApplication on NetworkTypes
//   let [appNtls] = await ctx.$m.applicationNetworkTypeLink.list({ where: { application: { id } } })
//   let logs = await Promise.all(appNtls.map(
//     appNtl => ctx.$.m.networkTypes.forAllNetworks({
//       networkTypeId: appNtl.networkType.id,
//       op: network => ctx.$m.networkProtocol.stopApplication({ network, applicationId: id })
//     })
//   ))
//   return R.flatten(logs)
// }

async function passDataToApplication (ctx, { id, networkId, data }) {
  // Ensure network is enabled
  const network = await ctx.$m.network.load({ where: { id: networkId } })
  if (!network.enabled) return
  // Ensure applicationNetworkTypeLink exists and is enabled
  let appNtl
  try {
    appNtl = await ctx.$m.applicationNetworkTypeLink.loadByQuery({ where: {
      application: { id },
      networkType: { id: network.networkType.id }
    } })
  }
  catch (err) {
    ctx.log.warn(`Received data from network ${networkId} for Application ${id}, but no ApplicationNetworkTypeLink found.`)
    return
  }
  if (!appNtl.enabled) {
    ctx.log.warn(`Received data from network ${networkId} for Application ${id}, but no ApplicationNetworkTypeLink is disabled.`)
    return
  }
  // Pass data
  await ctx.$m.networkProtocol.passDataToApplication({ network, applicationId: id, data })
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'application',
  publicApi: {
    create,
    list,
    load,
    update,
    upsert,
    remove,
    passDataToApplication
    // start,
    // stop
  },
  fragments
}
