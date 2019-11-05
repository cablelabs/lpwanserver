const { formatRelationshipsOut, formatRelationshipsIn } = require('../../lib/prisma')
const { pipe, authorize, parsePaginationQuery } = require('./openapi-middleware')
const R = require('ramda')

// ************************************************************
// CRUD Handlers
// ************************************************************
const requestContext = R.pick(['user'])
const pickId = R.pick(['id'])
const queryKeywords = ['offset', 'limit']
const nonWhereQuery = R.pick(queryKeywords)
const whereQuery = R.omit(queryKeywords)

const create = model => async (ctx, req, res) => {
  let data = formatRelationshipsIn(ctx.request.requestBody)
  const rec = await model.create({ data }, requestContext(req))
  res.status(201).json(pickId(rec))
}

const list = model => async (ctx, req, res) => {
  let args = {
    ...nonWhereQuery(ctx.request.query),
    where: formatRelationshipsIn(whereQuery(ctx.request.query)),
    includeTotal: true
  }
  const [records, totalCount] = await model.list(args, requestContext(req))
  res.status(200).json({ records: records.map(formatRelationshipsOut), totalCount })
}

const load = model => async (ctx, req, res) => {
  const rec = await model.load({ where: pickId(ctx.request.params) }, requestContext(req))
  res.status(200).json(formatRelationshipsOut(rec))
}

const update = model => async (ctx, req, res) => {
  let data = formatRelationshipsIn(ctx.request.requestBody)
  await model.update({ where: pickId(ctx.request.params), data }, requestContext(req))
  res.status(204).send()
}

const remove = model => async (ctx, req, res) => {
  await model.remove({ id: ctx.request.params.id }, requestContext(req))
  res.status(204).send()
}

// ************************************************************
// Build CRUD handlers for a model
// ************************************************************
const crudHandlers = handlers => (model, name, pluralName, ops = ['create', 'list', 'load', 'update', 'remove']) => {
  if (!pluralName) pluralName = `${name}s`

  const result = R.without(['list'], ops).reduce((acc, op) => {
    acc[`${op}${name}`] = pipe(
      authorize([`${name}:${op}`]),
      handlers[op](model)
    )
    return acc
  }, {})

  if (ops.includes('list')) {
    result[`list${name}`] = pipe(
      authorize([`${name}:list`]),
      parsePaginationQuery,
      handlers.list(model)
    )
  }

  return result
}

module.exports = {
  create,
  list,
  load,
  update,
  remove,
  requestContext,
  crudHandlers: crudHandlers({ create, list, load, update, remove })
}
