// Config access.
const R = require('ramda')
const { prune } = require('dead-leaves')

function mkError (status, err) {
  if (typeof err === 'string') err = new Error(err)
  err.status = err.statusCode = status
  throw err
}

async function onFail (status, action) {
  try {
    const result = await action()
    return result
  }
  catch (err) {
    throw mkError(status, err)
  }
}

function lowerFirst (x) {
  return `${x.charAt(0).toLowerCase()}${x.slice(1)}`
}

function upperFirst (x) {
  return `${x.charAt(0).toUpperCase()}${x.slice(1)}`
}

function formatRelationshipsIn (data) {
  const REF_PROP_RE = /^(.+)(Id|ID)$/
  return R.keys(data).reduce((acc, x) => {
    if (!REF_PROP_RE.test(x)) return R.assoc(x, data[x], acc)
    if (data[x] == null) return acc
    return R.assoc(x.replace(/(Id|ID)$/, ''), { id: data[x] }, acc)
  }, {})
}

function isRelationshipRef (val) {
  return val && typeof val === 'object' && 'id' in val && R.keys(val).length === 1
}

function formatRelationshipsOut (data) {
  return R.keys(data).reduce((acc, x) => {
    if (isRelationshipRef(data[x])) {
      return R.assoc(`${x}Id`, data[x].id, acc)
    }
    return R.assoc(x, data[x], acc)
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
  mkError,
  onFail,
  lowerFirst,
  upperFirst,
  formatRelationshipsIn,
  formatRelationshipsOut,
  connectRelationshipReferences,
  formatInputData
}
