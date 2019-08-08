const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { logger } = require('../log')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicPasswordPolicy on PasswordPolicy {
    id
    ruleText
    ruleRegExp
    company {
      id
    }
  }`
}

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'passwordPolicy',
  pluralName: 'passwordPolicies',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: logger.info.bind(logger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
function testRegExp (x) {
  return new RegExp(x)
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class PasswordPolicy {
  constructor (companyModel) {
    this.companies = companyModel
  }

  load (id) {
    return DB.load({ id })
  }

  async list (companyId, opts) {
    // Verify that the company exists.
    await this.companies.load(companyId)
    const where = { OR: [
      { company: { id: companyId } },
      { company: null }
    ] }
    return DB.list(where, opts)
  }

  async create (ruleText, ruleRegExp, companyId) {
    // verify regexp doesn't throw when created
    testRegExp(ruleRegExp)
    return DB.create({ ruleText, ruleRegExp, companyId })
  }

  async update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing PasswordPolicy ID')
    if (data.companyId) {
      // Verify that any new company exists if passed in.
      await this.companies.load(data.companyId)
    }
    return DB.update({ id }, data)
  }

  remove (id) {
    return DB.remove({ id })
  }

  async validatePassword (companyId, password) {
    // Get the rules from the passwordPolicies table
    const [ pwPolicies ] = await this.list(companyId)
    const failed = pwPolicies.filter(x => !(new RegExp(x.ruleRegExp).test(password)))
    if (!failed.length) return true
    throw httpError(400, `Password failed these policies: ${failed.map(x => x.ruleText).join('; ')}`)
  }
}
