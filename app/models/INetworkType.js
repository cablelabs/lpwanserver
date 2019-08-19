const { prisma } = require('../lib/prisma')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { logger } = require('../log')
const { redisClient } = require('../lib/redis')
const { createModel, create, list, load, update, remove } = require('./Model')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkType on NetworkType {
    id
    name
  }`
}

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'networkType',
    pluralName: 'networkTypes',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    create,
    list,
    load,
    update,
    remove
  }
)

module.exports = {
  model
}
