// Model is a proxy that presents a model's API
// The proxy is configured with things like db
// Which is passes to the methods called
// This gets us dependency injection and more easily tested model functions
const R = require('ramda')
const { renameKeys } = require('../lib/utils')
const { log } = require('../log')

const ModelFactory = models => ({ key, context, api }) => {
  let mergeCtx

  // Wrap api functions to pass context
  const $self = Object.keys(api).reduce((acc, x) => {
    acc[x] = (args, ctx) => {
      log.silly(`${key} ${x}`, { args })
      return api[x](mergeCtx(ctx), args)
    }
    return acc
  }, {})

  models[key] = $self
  mergeCtx = R.merge({ ...context, $m: models, $self })
  return $self
}

function create (ctx, args) {
  return ctx.db.create(args)
}

const renameQueryKeys = renameKeys({ search: 'name_contains' })

function list (ctx, { where = {}, ...opts } = {}) {
  return ctx.db.list({ where: renameQueryKeys(where), ...opts })
}

function load (ctx, args) {
  return ctx.db.load(args)
}

function update (ctx, args) {
  return ctx.db.update(args)
}

function remove (ctx, id) {
  return ctx.db.remove(id)
}

// Async generator for removing many records
async function * removeMany (ctx, { where, limit = 100 }) {
  let offset = 0
  let remaining = Infinity
  while (remaining > 0) {
    let [records, count] = await ctx.$self.list({ where, offset, limit, includeTotal: true })
    await Promise.all(records.map(x => ctx.$self.remove(x.id)))
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
