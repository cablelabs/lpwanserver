const appLogger = require('../lib/appLogger.js')
const { prisma } = require('../lib/prisma')
var httpError = require('http-errors')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')
const { renameKeys } = require('../lib/utils')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicCompany on Company {
    id
    name
    type
  }`
}

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'company',
  pluralName: 'companies',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
const renameQueryKeys = renameKeys({ search: 'name_contains' })

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class Company {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async load (id) {
    const company = await DB.load({ id })
    try {
      const [ records ] = await this.modelAPI.companyNetworkTypeLinks.list({ companyId: id })
      if (records.length) {
        company.networks = records.map(x => x.id)
      }
    }
    catch (err) {
      // ignore
    }
    return company
  }

  async list (query = {}, opts) {
    return DB.list(renameQueryKeys(query), opts)
  }

  create (name, type) {
    return DB.create({ name, type })
  }

  update ({ id, ...data }, opts) {
    if (!id) throw httpError(400, 'No existing Company ID')
    if (data.type === 'ADMIN') {
      throw httpError(403, 'Not able to change company type to ADMIN')
    }
    return DB.update({ id }, data, opts)
  }

  async remove (id) {
    // Delete my applications, users, and companyNetworkTypeLinks first.
    try {
      // Delete applications
      let [apps] = await this.modelAPI.applications.list({ companyId: id })
      await Promise.all(apps.map(x => this.modelAPI.applications.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's applications: " + err)
    }
    try {
      // Delete users
      let [ users ] = await this.modelAPI.users.list({ companyId: id })
      await Promise.all(users.map(x => this.modelAPI.users.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's users: " + err)
    }
    try {
      // Delete deviceProfiles
      let [ deviceProfiles ] = await this.modelAPI.deviceProfiles.list({ companyId: id })
      await Promise.all(deviceProfiles.map(x => this.modelAPI.deviceProfiles.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's deviceProfiles: " + err)
    }
    try {
      // Delete passwordPolicies
      let [ pwdPolicies ] = await this.modelAPI.passwordPolicies.list(id)
      // We can get null companyIds for cross-company rules - don't delete those.
      pwdPolicies = pwdPolicies.filter(x => x.company.id === id)
      await Promise.all(pwdPolicies.map(x => this.modelAPI.passwordPolicies.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's PasswordPolicies: " + err)
    }
    try {
      // Delete companyNetworkTypeLinks
      let [ companyNtls ] = await this.modelAPI.companyNetworkTypeLinks.list({ companyId: id })
      await Promise.all(companyNtls.map(x => this.modelAPI.companyNetworkTypeLinks.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's networkTypeLinks: " + err)
    }
    await DB.remove({ id })
  }
}
