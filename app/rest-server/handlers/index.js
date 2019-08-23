const models = require('../../models')
const { crudHandlers } = require('./crud')

function validationFail (c, _, res) {
  return res.status(400).json({ status: 400, err: c.validation.errors })
}

module.exports = {
  validationFail,
  // These resources expose all CRUD endpoints, protected by the appropriate permission
  ...crudHandlers(models.applicationNetworkTypeLinks, 'ApplicationNetworkTypeLink'),
  ...crudHandlers(models.applications, 'Application'),
  ...crudHandlers(models.devices, 'Device'),
  ...crudHandlers(models.deviceNetworkTypeLinks, 'DeviceNetworkTypeLink'),
  ...crudHandlers(models.deviceProfiles, 'DeviceProfile'),
  ...crudHandlers(models.networks, 'Network'),

  // These models are partly managed by the system, so CRUD access is restricted
  ...crudHandlers(models.networkProtocols, 'NetworkProtocol', null, ['list', 'load']),
  ...crudHandlers(models.networkTypes, 'NetworkType', null, ['list', 'load']),
  ...crudHandlers(models.reportingProtocols, 'ReportingProtocol', null, ['list', 'load']),

  // Users use the custom loadMyUser operation to access their own user
  // Only admin users have access to the loadUser operation
  // All users need access to update their email/password, so the updateUser operation
  // is not protected by the permission, which only admins have
  ...crudHandlers(models.users, 'User', null, ['create', 'list', 'load', 'remove']),

  // User custom endpoints
  ...require('./resources/user').handlers,

  // Session custom endpoints
  ...require('./resources/session').handlers,

  // Application custom endpoints
  ...require('./resources/application').handlers,

  // Device custom endpoints
  ...require('./resources/device').handlers
}
