// Database implementation.
const { prisma } = require('../../../lib/prisma')

var pwVal = require('./passwordPolicies.js')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

const CompNtwkTypeLink = require('./companyNetworkTypeLinks')

exports.COMPANY_VENDOR = 2
exports.COMPANY_ADMIN = 1
//* *****************************************************************************
// Companies database table.
//* *****************************************************************************
module.exports = {
  createCompany,
  retrieveCompany,
  updateCompany,
  deleteCompany,
  retrieveCompanybyName,
  retrieveCompanies,
  passwordValidator,
  getTypes
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the company record.
//
// name  - the name of the company
// type  - the company type. COMPANY_ADMIN can manage companies, etc.,
//         COMPANY_VENDOR is the typical vendor who just manages their own apps
//         and devices.
//
// Returns the promise that will execute the create.
function createCompany (name, type) {
  const data = { name, type }
  return prisma.createCompany(data)
}

async function loadCompany (uniqueKeyObj, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.company(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'Company not found')
  return rec
}

// Retrieve a company record by id.  This method retrieves not just the company
// fields, but also returns an array of the networkTypeIds the company has
// companyNetworkTypeLinks to.
//
// id - the record id of the company.
//
// Returns a promise that executes the retrieval.
async function retrieveCompany (id) {
  const company = await loadCompany({ id })
  try {
    const { records } = await CompNtwkTypeLink.retrieveCompanyNetworkTypeLinks({ companyId: id })
    if (records.length) {
      company.networks = records.map(x => x.networkType.id)
    }
  }
  catch (err) {
    // ignore
  }
  return company
}

// Update the company record.
//
// company - the updated record.  Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateCompany ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing Company ID')
  if (data.type) data.type = { connect: { id: data.type } }
  return prisma.updateCompany({ data, where: { id } }).$fragment(fragments.basic)
}

// Delete the company record.
//
// companyId - the id of the company record to delete.
//
// Returns a promise that performs the delete.
function deleteCompany (id) {
  return onFail(400, () => prisma.deleteCompany({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieve the company by name.
//
// Returns a promise that does the retrieval.
function retrieveCompanybyName (name) {
  return loadCompany({ name })
}

// Retrieves a subset of the companies in the system given the options.
//
// Options include limits on the number of companies returned, the offset to
// the first company returned (together giving a paging capability), and a
// search string on company name.
// The returned totalCount shows the number of records that match the query,
// ignoring any limit and/or offset.
async function retrieveCompanies ({ limit, offset, ...where } = {}) {
  if (where.search) {
    where.name_contains = where.search
    delete where.search
  }
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  const [records, totalCount] = await Promise.all([
    prisma.companies(query).$fragment(fragments.basic),
    prisma.companiesConnection({ where }).aggregate().count()
  ])
  return { totalCount, records }
}

//* *****************************************************************************
// Other functions.
//* *****************************************************************************

// Tests the password for validity based on the passwordPolicies for the
// company.
//
// companyId - The company to test the password for
// password  - The password to be tested.
//
// Returns a promise that will perform the tests.
async function passwordValidator (companyId, password) {
  // Get the rules from the passwordPolicies table
  const pwPolicies = await pwVal.retrievePasswordPolicies(companyId)
  const failed = pwPolicies.filter(x => !(new RegExp(x.ruleRegExp).test(password)))
  if (!failed.length) return true
  throw new Error('Password failed these policies:', failed.map(x => x.ruleText).join('; '))
}

// Gets the types of companies from the database table
function getTypes () {
  return prisma.companyTypes()
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
