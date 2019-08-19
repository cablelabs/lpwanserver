const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize, parsePaginationQuery } = require('./index')
const R = require('ramda')

// ************************************************************
// CRUD Handlers
// ************************************************************
const requestContext = R.pick(['user'])

const create = model => async (_, req, res) => {
  const rec = await model.create(req.body, requestContext(req))
  res.status(201).json({ id: rec.id })
}

const list = model => async (_, req, res) => {
  const [records, totalCount] = await model.list(req.query, { includeTotal: true }, requestContext(req))
  res.status(200).json({ records: records.map(formatRelationshipsOut), totalCount })
}

const load = model => async (_, req, res) => {
  const rec = await model.load(req.params.id, requestContext(req))
  res.status(200).json(formatRelationshipsOut(rec))
}

const update = model => async (_, req, res) => {
  await model.update({ id: req.params.id, ...req.body }, requestContext(req))
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
