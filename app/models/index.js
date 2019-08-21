const R = require('ramda')
const config = require('../config')
const { ModelFactory } = require('./model-lib')
const { prisma } = require('../lib/prisma')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const redis = require('../lib/redis')
const { log } = require('../log')
const { camelCaseToHyphen } = require('../lib/utils')

const dbClientFactory = (opts) => new CacheFirstStrategy({
  defaultFragmentKey: 'basic',
  prisma,
  redis: redis.keyval,
  ...opts
})

const models = {}

const addModel = R.curry((createModel, name, pluralName, path) => {
  pluralName = pluralName || `${name}s`
  path = path || `./${camelCaseToHyphen(name)}}`
  let { context, api, fragments } = require(path)
  context = R.merge({ log, config, redis }, context)
  if (fragments) {
    context.DB = dbClientFactory({ fragments, name, pluralName })
  }
  createModel({ key: pluralName, context, api })
})(ModelFactory(models))

addModel('application')
addModel('applicationNetworkTypeLink')
addModel('device')
addModel('deviceNetworkTypeLink')
addModel('deviceProfile')
addModel('email')
addModel('network')
addModel('networkProtocol')
addModel('networkType')
addModel('reportingProtocol')
addModel('session')
addModel('user', 'users', '../user')

module.exports = models
