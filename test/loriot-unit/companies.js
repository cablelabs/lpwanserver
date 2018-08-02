exports.COMPANY_VENDOR = 2
exports.COMPANY_ADMIN = 1
var company = {}

exports.createCompany = function (name, type) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    company.id = 1
    company.name = name
    company.type = type
    resolve(company)
  })
}

exports.retrieveCompany = function (id) {
  return new Promise(function (resolve, reject) {
    resolve(company)
  })
}

exports.updateCompany = function (c) {
  return new Promise(function (resolve, reject) {
    company = c
    resolve(company)
  })
}

exports.deleteCompany = function (companyId) {
  return new Promise(function (resolve, reject) {
    company = {}
    resolve(company)
  })
}

exports.retrieveCompanybyName = function (name) {
  return new Promise(function (resolve, reject) {
    resolve(company)
  })
}

exports.retrieveCompanies = function (options) {
  return new Promise(function (resolve, reject) {
    resolve(company)
  })
}

exports.passwordValidator = function (companyId, password) {
  return new Promise(function (resolve, reject) {
    resolve()
  })
}

exports.getTypes = function () {
  return new Promise(function (resolve, reject) {
    let types = [{admin: 1}, {vendor: 2}, {operator: 3}, {devicemfg: 4}]
    resolve(types)
  })
}
