// Model is a proxy that presents a model's API
// The proxy is configured with things like db
// Which is passes to the methods called
// This gets us dependency injection and more easily tested model functions
const R = require('ramda')
const { renameKeys } = require('../lib/utils')

const ModelFactory = models => ({ key, context: ctx, api }) => {
  let mergeCtx

  const proxyHandler = {
    get: (api, command) => {
      if (command in api) {
        return (args, ctx) => api[command](mergeCtx(ctx), args)
      }
      throw new TypeError(`Command "${command}" is not part of the ${key} model's API.`)
    }
  }

  const $self = new Proxy(api, proxyHandler)
  models[key] = $self
  mergeCtx = R.merge({ ...ctx, $m: models, $self })
  return $self
}

function create (ctx, args) {
  return ctx.DB.create(args)
}

const renameQueryKeys = renameKeys({ search: 'name_contains' })

function list (ctx, { where = {}, ...opts }) {
  return ctx.DB.list({ where: renameQueryKeys(where), ...opts })
}

function load (ctx, args) {
  return ctx.DB.load(args)
}

function update (ctx, args) {
  return ctx.DB.update(args)
}

function remove (ctx, id) {
  return ctx.DB.remove(id)
}

// Async generator for removing many records
async function * removeMany (ctx, { where, limit = 100 }) {
  let offset = 0
  let remaining = Infinity
  while (remaining > 0) {
    let [records, count] = await ctx.$self.list({ where, offset, limit, includeTotal: true })
    await Promise.all(records.map(x => ctx.$self.remove({ where: { id: x.id } })))
    offset = offset + limit
    remaining = count - limit
    yield {
      removed: records.map(R.prop('id')),
      remaining
    }
  }
}

// Async generator for listing all records in a collection
async function * listAll (ctx, { where, limit = 100, ...opts }) {
  let offset = 0
  let total = Infinity
  while (offset < total) {
    let [records, totalCount] = await ctx.$self.list({ ...opts, where, limit, includeTotal: true })
    yield { records, totalCount, offset }
    offset = offset + limit
    total = totalCount
  }
}

module.exports = {
  ModelFactory,
  create,
  list,
  listAll,
  load,
  update,
  remove,
  removeMany
}
