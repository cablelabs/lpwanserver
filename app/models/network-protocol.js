const path = require('path')
const { renameKeys } = require('../lib/utils')
const registerNetworkProtocols = require('../networkProtocols/register')
const { create, load, update, remove } = require('./Model')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkProtocol on NetworkProtocol {
    id
    name
    displayName
    version
  }`
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const handlerDir = path.join(__dirname, '../networkProtocols/handlers')

function addMetadata (rec) {
  return {
    ...rec,
    metaData: require(path.join(handlerDir, rec.protocolHandler, 'metadata'))
  }
}
const renameQueryKeys = renameKeys({
  search: 'name_contains',
  version: 'version_contains'
})

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function initialize (ctx) {
  await registerNetworkProtocols(ctx.$m)
  const [ records ] = await ctx.DB.list()
  const handlersDir = path.join(__dirname, '../networkProtocols/handlers')
  records.forEach(x => {
    let Handler = require(path.join(handlersDir, x.protocolHandler))
    ctx.handlers[x.id] = new Handler({ modelAPI: ctx.$m, networkProtocolId: x.id })
  })
}

async function list (ctx, { where = {}, ...opts }) {
  let [records, totalCount] = await ctx.DB.list({ where: renameQueryKeys(where), ...opts })
  return [records.map(addMetadata), totalCount]
}

async function upsert (ctx, { version, name, ...np }) {
  const [nps] = await ctx.$self.list({ where: { search: name, version }, limit: 1 })
  if (nps.length) {
    return ctx.$self.update(ctx, { where: { id: nps[0].id }, data: np })
  }
  return ctx.$self.create(ctx, { data: { ...np, version, name } })
}

function getHandler (ctx, { id }) {
  return ctx.handlers[id]
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  context: { handlers: {} },
  api: {
    initialize,
    create,
    list,
    load,
    update,
    upsert,
    remove,
    getHandler
  },
  fragments
}
