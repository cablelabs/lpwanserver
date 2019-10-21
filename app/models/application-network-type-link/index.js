var httpError = require('http-errors')
const { list, listAll, load, removeMany, loadByQuery } = require('../model-lib')
const R = require('ramda')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicApplicationNetworkTypeLink on ApplicationNetworkTypeLink {
    id
    networkSettings
    enabled
    application {
      id
    }
    networkType {
      id
    }
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function enabledValidation (ctx, { application }) {
  // Ensure app has a ReportingProtocol
  const [reportingProtocols] = await ctx.$m.applicationReportingProtocols.list({
    where: { application }
  })
  if (!reportingProtocols.length) {
    throw httpError(400, 'ApplicationNetworkTypeLink cannot be enabled because Application has no ReportingProtocol.')
  }
}

async function create (ctx, { data, origin }) {
  data = { enabled: false, ...data }
  if (data.enabled) {
    await ctx.$self.enabledValidation({ application: data.application })
  }
  const rec = await ctx.db.create({ data })
  await ctx.$.m.networkTypes.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: network => {
      const isOrigin = origin && origin.network.id === network.id
      const meta = {
        isOrigin,
        enabled: origin.enabled || false
      }
      if (isOrigin) meta.remoteId = origin.remoteId
      ctx.$m.networkDeployment.create({
        data: {
          status: 'CREATED',
          type: 'APPLICATION',
          meta: meta,
          network: { id: network.id },
          application: rec.application
        }
      })
    }
  })
  return rec
}

async function update (ctx, { where, data, origin }) {
  let rec
  // No changing the application or the network.
  if (data.applicationId || data.networkTypeId) {
    throw httpError(403, 'Cannot change link targets')
  }
  if (data.enabled) {
    rec = await ctx.$self.load({ where })
    await ctx.$self.enabledValidation({ application: rec.application })
  }
  rec = await ctx.db.update({ where, data })
  await ctx.$.m.networkTypes.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: network => {
      // Nothing to do if update came from remote application
      if (origin && origin.network.id === network.id) return Promise.resolve()
      return ctx.$m.networkDeployment.updateByQuery({
        where: { network: { id: network.id }, application: rec.application },
        data: { status: 'UPDATED' }
      })
    }
  })
  return rec
}

async function remove (ctx, id) {
  var rec = await ctx.db.load({ where: { id } })

  // Delete deviceNetworkTypeLinks
  for await (let devState of ctx.$m.device.listAll({ where: { application: rec.application } })) {
    let ids = devState.records.map(R.prop('id'))
    for await (let state of ctx.$m.deviceNetworkTypeLink.removeMany({ where: { device: { id_in: ids } } })) {
    }
  }

  await ctx.$.m.networkTypes.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: async network => ctx.$m.networkDeployment.updateByQuery({
      where: { network: { id: network.id }, application: rec.application },
      data: { status: 'REMOVED' }
    })
  })

  await ctx.db.remove(id)
}

// async function pushApplicationNetworkTypeLink (ctx, id) {
//   var rec = await ctx.db.load({ where: { id } })

//   // Push deviceNetworkTypeLinks
//   for await (let devState of ctx.$m.device.listAll({ where: { application: { id } } })) {
//     let ids = devState.records.map(R.prop('id'))
//     for await (let devNtlState of ctx.$m.deviceNetworkTypeLink.listAll({ where: { device: { id_in: ids } } })) {
//       let ids = devNtlState.map(R.prop('id'))
//       await Promise.all(ids.map(ctx.$m.deviceNetworkTypeLink.pushDeviceNetworkTypeLink))
//     }
//   }

//   rec.remoteAccessLogs = ctx.$.m.networkTypes.forAllNetworks({
//     networkTypeId: rec.networkType.id,
//     op: network => ctx.$m.networkProtocol.pushApplication({
//       network,
//       applicationId: rec.application.id,
//       networkSettings: rec.networkSettings
//     })
//   })

//   return rec
// }

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'applicationNetworkTypeLink',
  publicApi: {
    create,
    list,
    listAll,
    load,
    loadByQuery,
    update,
    remove,
    removeMany
    // pushApplicationNetworkTypeLink
  },
  privateApi: {
    enabledValidation
  },
  fragments
}
