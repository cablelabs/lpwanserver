// Database implementation.
const { prisma } = require('../../../lib/prisma')

// Error reporting
const httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

//* *****************************************************************************
// PasswordPolicies database table.
//* *****************************************************************************

module.exports = {
  createPasswordPolicy,
  retrievePasswordPolicy,
  updatePasswordPolicy,
  deletePasswordPolicy,
  retrievePasswordPolicies
}

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the passwordPolicy record.
//
// ruleText   - the description of the rule for users.
// ruleRegExp - the regular expression that enforces the rule.  The password
//              must match this expression to be valid.
// companyId  - The id of the company that this rule if for (null for all).
//
// Returns the promise that will execute the create.
async function createPasswordPolicy (ruleText, ruleRegExp, companyId) {
  // verify regexp doesn't throw when created
  const valid = new RegExp(ruleRegExp)
  var data = { ruleText, ruleRegExp }
  if (companyId) {
    data.company = { connect: { id: companyId } }
  }
  return prisma.createPasswordPolicy(data)
}

// Retrieve a passwordPolicy record by id.
//
// id - the record id of the passwordPolicy.
//
// Returns a promise that executes the retrieval.
async function retrievePasswordPolicy (id, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.passwordPolicy({ id })).$fragment(fragments[fragementKey])
  if (!rec) throw httpError(404, 'PasswordPolicy not found')
  return rec
}

// Update the passwordPolicy record.
//
// passwordPolicy - the updated record.  Note that the id must be unchanged from
//                  retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
async function updatePasswordPolicy ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing PasswordPolicy ID')
  if (data.companyId) {
    data.company = { connect: { id: data.companyId } }
    delete data.companyId
  }
  return prisma.updatePasswordPolicy({ data, where: { id } }).$fragment(fragments.basic)
}

// Delete the passwordPolicy record.
//
// id - the id of the passwordPolicy record to delete.
//
// Returns a promise that performs the delete.
function deletePasswordPolicy (id) {
  return onFail(400, () => prisma.deletePasswordPolicy({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves all passwordPolicy records relevant to the company.
// Note that the query verifies that the company exists.
//
// companyId - the id of the company record.
//
// Returns a promise that retrieves the passwordPolicies.
function retrievePasswordPolicies (companyId) {
  const where = { OR: [
    { company: { id: companyId } },
    { company: null }
  ] }
  return prisma.passwordPolicies({ where })
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicPasswordPolicy on PasswordPolicy {
    ruleText
    ruleRegExp
    company {
      id
    }
  }`
}
