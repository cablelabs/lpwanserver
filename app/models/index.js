const R = require('ramda')
const config = require('../config')
const { createModel } = require('./model-lib')
const { prisma } = require('../lib/prisma')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const redis = require('../lib/redis')
const { log } = require('../log')

const dbClientFactory = (opts) => new CacheFirstStrategy({
  defaultFragmentKey: 'basic',
  prisma,
  redis: redis.keyval,
  ...opts
})

const models = {}

const globalContext = {
  $m: models,
  log,
  config,
  redis
}

const addModel = path => {
  let { role, context, fragments, ...args } = require(path)
  context = R.merge(globalContext, context)
  if (fragments) {
    let pluralName = `${role}s`
    context.db = dbClientFactory({ fragments, name: role, pluralName })
  }
  models[role] = createModel({ ...args, role, context })
}

addModel('./application')
addModel('./application-network-type-link')
addModel('./device')
addModel('./device-network-type-link')
addModel('./device-profile')
addModel('./network')
addModel('./network-protocol')
addModel('./network-type')
addModel('./protocol-data')
addModel('./reporting-protocol')
addModel('./session')
addModel('./user')

module.exports = models
