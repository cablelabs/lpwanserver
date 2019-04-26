const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class PasswordPolicy {
  constructor (companyModel) {
    this.companies = companyModel
  }

  async createPasswordPolicy (ruleText, ruleRegExp, companyId) {
    // verify regexp doesn't throw when created
    testRegExp(ruleRegExp)
    var data = { ruleText, ruleRegExp }
    if (companyId) {
      data.company = { connect: { id: companyId } }
    }
    return prisma.createPasswordPolicy(data)
  }

  async retrievePasswordPolicy (id, fragementKey = 'basic') {
    const rec = await onFail(400, () => prisma.passwordPolicy({ id }).$fragment(fragments[fragementKey]))
    if (!rec) throw httpError(404, 'PasswordPolicy not found')
    return rec
  }

  async retrievePasswordPolicies (companyId) {
    // Verify that the company exists.
    await this.companies.retrieveCompany(companyId)
    const where = { OR: [
      { company: { id: companyId } },
      { company: null }
    ] }
    return prisma.passwordPolicies({ where })
  }

  async updatePasswordPolicy ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing PasswordPolicy ID')
    if (data.companyId) {
      // Verify that any new company exists if passed in.
      await this.companies.retrieveCompany(data.companyId)
      data.company = { connect: { id: data.companyId } }
      delete data.companyId
    }
    return prisma.updatePasswordPolicy({ data, where: { id } }).$fragment(fragments.basic)
  }

  deletePasswordPolicy (id) {
    return onFail(400, () => prisma.deletePasswordPolicy({ id }))
  }

  async validatePassword (companyId, password) {
    // Get the rules from the passwordPolicies table
    const pwPolicies = await this.retrievePasswordPolicies(companyId)
    const failed = pwPolicies.filter(x => !(new RegExp(x.ruleRegExp).test(password)))
    if (!failed.length) return true
    throw new Error('Password failed these policies:', failed.map(x => x.ruleText).join('; '))
  }
}

// ******************************************************************************
// Test RegExp
// ******************************************************************************
// Should throw an error if x is invalid regular expression
function testRegExp (x) {
  return new RegExp(x)
}

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicPasswordPolicy on PasswordPolicy {
    ruleText
    ruleRegExp
    company {
      id
    }
  }`
}
