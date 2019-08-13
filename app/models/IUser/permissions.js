const R = require('ramda')

const resources = [
  'Application',
  'ApplicationNetworkTypeLink',
  'Company',
  'CompanyNetworkTypeLink',
  'Device',
  'DeviceNetworkTypeLink',
  'DeviceProfile',
  'Network',
  'NetworkProtocol',
  'NetworkProvider',
  'NetworkType',
  'PasswordPolicy',
  'ReportingProtocol',
  'User'
]

const otherPermissions = [
  'Session:remove',
  'ApplicationNetworkTypeLink:push'
]

function createResourcePermissions (resource, operations) {
  if (!operations) operations = ['create', 'update', 'load', 'list', 'remove']
  return operations.map(x => `${resource}:${x}`)
}

const adminPermissions = [
  ...R.flatten(resources.map(x => createResourcePermissions(x))),
  ...otherPermissions
]

// Non-admin users can access/mutate application and device management resources
const userRoleRegex = /application|device/g
const userPermissions = [
  ...adminPermissions.filter(x => userRoleRegex.test(x)),
  ...otherPermissions
]

module.exports = {
  adminPermissions,
  userPermissions
}
