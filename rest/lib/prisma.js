// Config access.
var nconf = require('nconf')
var path = require('path')
const R = require('ramda')
const { mutate } = require('./utils')
const { prune } = require('dead-leaves')

const prismaClientPath = path.join(
  __dirname,
  '../../prisma',
  nconf.get('prisma_dir'),
  'generated/prisma-client/index-dynamic-endpoint'
)

function formatRelationshipsIn (data) {
  const REF_PROP_RE = /^(.+)Id$/
  return R.keys(data).reduce((acc, x) => {
    if (!REF_PROP_RE.test(x)) return mutate(x, data[x], acc)
    return mutate(x.replace(/Id$/, ''), { id: data[x] }, acc)
  }, {})
}

function formatRelationshipsOut (data) {
  return R.keys(data).reduce((acc, x) => {
    const val = data[x]
    if (val && typeof val === 'object' && 'id' in val && R.keys(val).length === 1) {
      return mutate(`${x}Id`, data[x].id, acc)
    }
    return mutate(x, data[x], acc)
  }, {})
}

function connectRelationshipReferences (data) {
  return R.keys(data).reduce((acc, x) => {
    if (typeof acc[x] === 'object' && 'id' in acc[x]) {
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
