const appLogger = require('../lib/appLogger.js')
const { onFail } = require('../lib/utils')
const { prisma, loadRecord } = require('../lib/prisma')
var httpError = require('http-errors')

module.exports = class Company {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
    this.COMPANY_ADMIN = 1
    this.COMPANY_VENDOR = 2
    this.types = {}
    this.reverseTypes = {}
  }

  async init () {
    try {
      const types = await prisma.companyTypes()
      for (var i = 0; i < types.length; ++i) {
        this.types[ types[ i ].name ] = types[ i ].id
        this.reverseTypes[ types[ i ].id ] = types[ i ].name
      }
    }
    catch (err) {
      appLogger.log('Failed to load company types: ' + err)
      throw err
    }
  }

  create (name, type) {
    const data = { name, type }
    return prisma.createCompany(data)
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing Company ID')
    if (data.type) data.type = { connect: { id: data.type } }
    return prisma.updateCompany({ data, where: { id } }).$fragment(fragments.basic)
  }

  async load (id) {
    const company = await loadCompany({ id })
    try {
      const { records } = await this.modelAPI.companyNetworkTypeLinks.list({ companyId: id })
      if (records.length) {
        company.networks = records.map(x => x.id)
      }
    }
    catch (err) {
      // ignore
    }
    return company
  }

  async list ({ limit, offset, ...where } = {}) {
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    appLogger.log(`modelAPI.companies.list: ${JSON.stringify(query)}`)
    const [records, totalCount] = await Promise.all([
      prisma.companies(query).$fragment(fragments.basic),
      prisma.companiesConnection({ where }).aggregate().count()
    ])
    return { totalCount, records }
  }

  async remove (id) {
    // Delete my applications, users, and companyNetworkTypeLinks first.
    try {
      // Delete applications
      let { records: apps } = await this.modelAPI.applications.list({ companyId: id })
      await Promise.all(apps.map(x => this.modelAPI.applications.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's applications: " + err)
    }
    try {
      // Delete users
      let { records: users } = await this.modelAPI.users.list({ companyId: id })
      await Promise.all(users.map(x => this.modelAPI.users.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's users: " + err)
    }
    try {
      // Delete deviceProfiles
      let { records: deviceProfiles } = await this.modelAPI.deviceProfiles.list({ companyId: id })
      await Promise.all(deviceProfiles.map(x => this.modelAPI.deviceProfiles.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's deviceProfiles: " + err)
    }
    try {
      // Delete passwordPolicies
      let { records: pwdPolicies } = await this.modelAPI.passwordPolicies.list(id)
      // We can get null companyIds for cross-company rules - don't delete those.
      pwdPolicies = pwdPolicies.filter(x => x.company.id === id)
      await Promise.all(pwdPolicies.map(x => this.modelAPI.passwordPolicies.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's PasswordPolicies: " + err)
    }
    try {
      // Delete companyNetworkTypeLinks
      let { records: companyNtls } = await this.modelAPI.companyNetworkTypeLinks.list({ companyId: id })
      await Promise.all(companyNtls.map(x => this.modelAPI.companyNetworkTypeLinks.remove(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's networkTypeLinks: " + err)
    }
    await onFail(400, () => prisma.deleteCompany({ id }))
  }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicCompany on Company {
    id
    name
    type {
      id
    }
  }`
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const loadCompany = loadRecord('company', fragments, 'basic')
