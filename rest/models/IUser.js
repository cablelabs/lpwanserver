// Configuration access.
var nconf = require('nconf')

//* *****************************************************************************
// The User interface.
//* *****************************************************************************
var roles = {}
var reverseRoles = {}
function User () {
  // Get the specified implementation.
  this.impl = require('./dao/' +
                             nconf.get('impl_directory') +
                             '/users.js')

  // Set up globals.
  this.ROLE_ADMIN = this.impl.ROLE_ADMIN
  this.ROLE_USER = this.impl.ROLE_USER
  this.roles = roles
  this.reverseRoles = reverseRoles

  // Load the roles
  let roleList = this.impl.getRoles()
  for (var i = 0; i < roleList.length; ++i) {
    roles[ roleList[ i ].name ] = roleList[ i ].roleId
    reverseRoles[ roleList[ i ].roleId ] = roleList[ i ].name
  }
}

User.prototype.authorizeUser = function (username, password) {
  return this.impl.authorizeUser(username, password)
}

User.prototype.retrieveUserByUsername = function (user) {
  return this.impl.retrieveUserByUsername(user)
}

User.prototype.retrieveUserProfile = function (user) {
  return this.impl.retrieveUserProfile(user)
}

User.prototype.retrieveUsers = function (options) {
  return this.impl.retrieveUsers(options)
}

User.prototype.retrieveUser = function (id) {
  return this.impl.retrieveUser(id)
}

User.prototype.createUser = function (username, password, email, companyId, role) {
  return this.impl.createUser(username, password, email, companyId, role)
}

User.prototype.updateUser = function (user) {
  return this.impl.updateUser(user)
}

User.prototype.deleteUser = function (id) {
  return this.impl.deleteUser(id)
}

User.prototype.emailVerifyInit = function () {
  this.impl.emailVerifyInit()
}

User.prototype.handleEmailVerifyResponse = function (uuid, func, source) {
  return this.impl.handleEmailVerifyResponse(uuid, func, source)
}

module.exports = User
