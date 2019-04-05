// Configuration access.
const config = require('../config')

//* *****************************************************************************
// The PasswordPolicy interface.
//* *****************************************************************************
var pp
function PasswordPolicy (companies) {
  this.impl = require('./dao/' +
                             config.get('impl_directory') +
                             '/passwordPolicies.js')
  this.companies = companies
  pp = this
}

PasswordPolicy.prototype.retrievePasswordPolicies = function (companyId) {
  return new Promise(function (resolve, reject) {
    // Verify that the company exists.
    pp.companies.retrieveCompany(companyId).then(function () {
      pp.impl.retrievePasswordPolicies(companyId).then(function (rows) {
        resolve(rows)
      })
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

PasswordPolicy.prototype.retrievePasswordPolicy = function (id) {
  return this.impl.retrievePasswordPolicy(id)
}

PasswordPolicy.prototype.createPasswordPolicy = function (ruleText, ruleRegExp, companyId) {
  return this.impl.createPasswordPolicy(ruleText, ruleRegExp, companyId)
}

PasswordPolicy.prototype.updatePasswordPolicy = function (passwordPolicy) {
  return new Promise(function (resolve, reject) {
    // Verify that any new company exists if passed in.
    if (passwordPolicy.companyId) {
      pp.companies.retrieveCompany(passwordPolicy.companyId).then(function () {
        pp.impl.updatePasswordPolicy(passwordPolicy).then(function () {
          resolve()
        })
      })
        .catch(function (err) {
          reject(err)
        })
    }
    // Otherwise just update.
    else {
      pp.impl.updatePasswordPolicy(passwordPolicy).then(function () {
        resolve()
      })
        .catch(function (err) {
          reject(err)
        })
    }
  })
}

PasswordPolicy.prototype.deletePasswordPolicy = function (id) {
  return this.impl.deletePasswordPolicy(id)
}

module.exports = PasswordPolicy
