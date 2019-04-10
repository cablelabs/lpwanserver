const appLogger = require('../lib/appLogger.js')
const { onFail } = require('../lib/utils')
const { prisma } = require('../lib/prisma')
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

  createCompany (name, type) {
    const data = { name, type }
    return prisma.createCompany(data)
  }

  updateCompany ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing Company ID')
    if (data.type) data.type = { connect: { id: data.type } }
    return prisma.updateCompany({ data, where: { id } }).$fragment(fragments.basic)
  }

  async retrieveCompany (id) {
    const company = await loadCompany({ id })
    try {
      const { records } = await this.modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks({ companyId: id })
      if (records.length) {
        company.networks = records.map(x => x.id)
      }
    }
    catch (err) {
      // ignore
    }
    return company
  }

  async retrieveCompanies ({ limit, offset, ...where } = {}) {
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    appLogger.log(`modelAPI.companies.retrieveCompanies: ${JSON.stringify(query)}`)
    const [records, totalCount] = await Promise.all([
      prisma.companies(query).$fragment(fragments.basic),
      prisma.companiesConnection({ where }).aggregate().count()
    ])
    return { totalCount, records }
  }

  async deleteCompany (id) {
    // Delete my applications, users, and companyNetworkTypeLinks first.
    try {
      // Delete applications
      let { records: apps } = await this.modelAPI.applications.retrieveApplications({ companyId: id })
      await Promise.all(apps.map(x => this.modelAPI.applications.deleteApplication(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's applications: " + err)
    }
    try {
      // Delete users
      let { records: users } = await this.modelAPI.users.retrieveUsers({ companyId: id })
      await Promise.all(users.map(x => this.modelAPI.users.deleteUser(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's users: " + err)
    }
    try {
      // Delete deviceProfiles
      let { records: deviceProfiles } = await this.modelAPI.deviceProfiles.retrieveDeviceProfiles({ companyId: id })
      await Promise.all(deviceProfiles.map(x => this.modelAPI.deviceProfiles.deleteDeviceProfile(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's deviceProfiles: " + err)
    }
    try {
      // Delete passwordPolicies
      let { records: pwdPolicies } = await this.modelAPI.passwordPolicies.retrievePasswordPolicies(id)
      // We can get null companyIds for cross-company rules - don't delete those.
      pwdPolicies = pwdPolicies.filter(x => x.company.id === id)
      await Promise.all(pwdPolicies.map(x => this.modelAPI.passwordPolicies.deletePasswordPolicy(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's PasswordPolicies: " + err)
    }
    try {
      // Delete companyNetworkTypeLinks
      let { records: companyNtls } = await this.modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks({ companyId: id })
      await Promise.all(companyNtls.map(x => this.modelAPI.companyNetworkTypeLinks.deleteCompanyNetworkTypeLink(x.id)))
    }
    catch (err) {
      appLogger.log("Error deleting company's networkTypeLinks: " + err)
    }
    await onFail(400, () => prisma.deleteCompany({ id }))
  }
}

async function loadCompany (uniqueKeyObj, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.company(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'Company not found')
  return rec
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
