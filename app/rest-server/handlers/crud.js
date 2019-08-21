const { formatRelationshipsOut, formatRelationshipsIn } = require('../../lib/prisma')
const { pipe, authorize, parsePaginationQuery } = require('./index')
const R = require('ramda')

// ************************************************************
// CRUD Handlers
// ************************************************************
const requestContext = R.pick(['user'])
const pickId = R.pick(['id'])

const create = model => async (_, req, res) => {
  let data = formatRelationshipsIn(req.body)
  const rec = await model.create({ data }, requestContext(req))
  res.status(201).json(pickId(rec))
}

const list = model => async (_, req, res) => {
  let args = { where: formatRelationshipsIn(req.query), includeTotal: true }
  const [records, totalCount] = await model.list(args, requestContext(req))
  res.status(200).json({ records: records.map(formatRelationshipsOut), totalCount })
}

const load = model => async (_, req, res) => {
  const rec = await model.load({ where: pickId(req.params) }, requestContext(req))
  res.status(200).json(formatRelationshipsOut(rec))
}

const update = model => async (_, req, res) => {
  let data = formatRelationshipsIn(req.body)
  await model.update({ where: pickId(req.params), data }, requestContext(req))
  res.status(204).send()
}

const remove = model => async (_, req, res) => {
  await model.remove(req.params.id, requestContext(req))
  res.status(204).send()
}

// ************************************************************
// Build CRUD handlers for a model
// ************************************************************
const crudHandlers = handlers => ({ model, name, pluralName, ops = ['create', 'list', 'load', 'update', 'remove'] }) => {
  if (!pluralName) pluralName = `${name}s`

  const result = R.omit(['list'], ops).reduce((acc, op) => {
    acc[`${op}${name}`] = pipe(
      authorize([`${name}:${op}`]),
      handlers[op](model)
    )
  }, {})

  if (ops.list) {
    result[`list:${name}`] = pipe(
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
