const path = require('path')
const { renameKeys } = require('../../lib/utils')
const registerNetworkProtocols = require('../../networkProtocols/register')
const { load, update, remove } = require('../model-lib')
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
  const handler = ctx.$self.getHandler({ id: args.network.networkProtocol.id })
  await handler[command](args)
}

async function test (ctx, { network }) {
  if (!network.securityData.authorized) {
    throw httpError.Unauthorized()
  }
  const handler = ctx.$self.getHandler(network.networkProtocol)
  await handler.test({ network })
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
    pushNetwork: handlerCommand('pushNetwork'),
    pullNetwork: handlerCommand('pullNetwork'),
    addApplication: handlerCommand('addApplication'),
    deleteApplication: handlerCommand('deleteApplication'),
    pushApplication: handlerCommand('pushApplication'),
    pullApplication: handlerCommand('pullApplication'),
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
