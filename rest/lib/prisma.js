// Config access.
const R = require('ramda')
const { mutate, onFail } = require('./utils')
const { prune } = require('dead-leaves')
const httpError = require('http-errors')

const prismaClient = require('../../prisma/generated/prisma-client')

function formatRelationshipsIn (data) {
  const REF_PROP_RE = /^(.+)Id$/
  return R.keys(data).reduce((acc, x) => {
    if (!REF_PROP_RE.test(x)) return mutate(x, data[x], acc)
    if (data[x] == null) return acc
    return mutate(x.replace(/Id$/, ''), { id: data[x] }, acc)
  }, {})
}

function isRelationshipRef (val) {
  return val && typeof val === 'object' && 'id' in val && R.keys(val).length === 1
}

function formatRelationshipsOut (data) {
  return R.keys(data).reduce((acc, x) => {
    if (isRelationshipRef(data[x])) {
      return mutate(`${x}Id`, data[x].id, acc)
    }
    return mutate(x, data[x], acc)
  }, {})
}

function connectRelationshipReferences (data) {
  return R.keys(data).reduce((acc, x) => {
    if (isRelationshipRef(acc[x])) {
      acc[x] = { connect: acc[x] }
    }
    return acc
  }, data)
}

function formatInputPruneFilter (x) {
  return typeof x !== 'undefined'
}

// remove any undefined properties, then format the reference connections
const formatInputData = R.compose(
  connectRelationshipReferences,
  formatRelationshipsIn,
  x => prune(x, formatInputPruneFilter)
)

function loadRecord (modelName, fragments, defaultFragment) {
  const modelNameCapitolized = `${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}`
  const modelNameLower = `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`
  return async (uniqueKeyObj, fragment = defaultFragment) => {
    const rec = await onFail(400, () => prismaClient.prisma[modelNameLower](uniqueKeyObj).$fragment(fragments[fragment]))
    if (!rec) throw httpError(404, `${modelNameCapitolized} not found.`)
    return rec
  }
}

module.exports = {
  ...prismaClient,
  formatRelationshipsIn,
  formatRelationshipsOut,
  connectRelationshipReferences,
  formatInputData,
  loadRecord
}
