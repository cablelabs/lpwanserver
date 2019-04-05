// Config access.
var path = require('path')
const R = require('ramda')
const { mutate } = require('./utils')
const { prune } = require('dead-leaves')
const config = require('../config')

const prismaClientPath = path.join(
  __dirname,
  '../../prisma',
  config.get('prisma_dir'),
  'generated/prisma-client/index-dynamic-endpoint'
)

function formatRelationshipsIn (data) {
  const REF_PROP_RE = /^(.+)Id$/
  return R.keys(data).reduce((acc, x) => {
    if (!REF_PROP_RE.test(x)) return mutate(x, data[x], acc)
    if (data[x] == null) return acc
    const id = parseInt(data[x], 10)
    return mutate(x.replace(/Id$/, ''), { id }, acc)
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

module.exports = {
  ...require(prismaClientPath),
  formatRelationshipsIn,
  formatRelationshipsOut,
  connectRelationshipReferences,
  formatInputData
}
