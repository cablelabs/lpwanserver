const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { renameKeys } = require('../lib/utils')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')
const appLogger = require('../lib/appLogger')
const { redisClient } = require('../lib/redis')

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
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'networkType',
  pluralName: 'networkTypes',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class NetworkType {
  load (id) {
    return DB.load({ id })
  }

  async list (query = {}, opts) {
    return DB.list(renameKeys({ search: 'name_contains' }, query), opts)
  }

  create (name) {
    return DB.create({ name })
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkType ID')
    return DB.update({ id }, data)
  }

  remove (id) {
    return DB.remove({ id })
  }

  loadByName (name) {
    return DB.load({ name })
  }
}
