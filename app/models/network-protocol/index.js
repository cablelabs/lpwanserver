const path = require('path')
const { renameKeys, getUpdates } = require('../../lib/utils')
const registerNetworkProtocols = require('../../networkProtocols/register')
const { load, update, remove, loadByQuery } = require('../model-lib')
const httpError = require('http-errors')

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

const handlerCommand = command => async (ctx, args) => {
  const handler = await ctx.$self.getHandler(args.network.networkProtocol)
  return handler[command](args)
}

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
async function test (ctx, { network }) {
  if (!network.meta.authorized) {
    throw httpError.Unauthorized()
  }
  const handler = await ctx.$self.getHandler(network.networkProtocol)
  await handler.test({ network })
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
    relayUplink,
    passDataToDevice,
    ...require('./network-pull'),
    ...require('./network-push'),
    ...require('./network-deployment-sync')
  },
  fragments
}
