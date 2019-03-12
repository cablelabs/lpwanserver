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

const REF_PROP_RE = /^(.+)Id$/

const formatRelationshipReferences = R.curry(
  function formatRelationshipReferences (type, data) {
    return R.keys(data).reduce((acc, x) => {
      if (!REF_PROP_RE.test(x)) return mutate(x, data[x], acc)
      switch (type) {
        // Format from entId to ent: { id }
        case 'in': return mutate(x.replace(/Id$/, ''), { id: data[x] }, acc)
        // Format from end: { id } to entId
        case 'out': return mutate(`${x}Id`, data[x].id, acc)
        // If type not recognized, don't change anything
        default: return mutate(x, data[x], acc)
      }
    }, {})
  }
)

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
  formatRelationshipReferences('in'),
  x => prune(x, formatInputPruneFilter)
)

module.exports = {
  prisma: require(prismaClientPath),
  formatRelationshipReferences,
  connectRelationshipReferences,
  formatInputData
}
