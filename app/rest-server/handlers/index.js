const models = require('../../models')
const { crudHandlers } = require('./crud')

function validationFail (c, _, res) {
  return res.status(400).json({ status: 400, err: c.validation.errors })
}

const handlers = {
  validationFail,
  // These resources expose all CRUD endpoints, protected by the appropriate permission
  ...crudHandlers(models.applicationNetworkTypeLink, 'ApplicationNetworkTypeLink'),
  ...crudHandlers(models.application, 'Application'),
  ...crudHandlers(models.device, 'Device'),
  ...crudHandlers(models.deviceNetworkTypeLink, 'DeviceNetworkTypeLink'),
  ...crudHandlers(models.deviceProfile, 'DeviceProfile'),
  ...crudHandlers(models.network, 'Network'),

  // These models are partly managed by the system, so CRUD access is restricted
  ...crudHandlers(models.networkProtocol, 'NetworkProtocol', null, ['list', 'load']),
  ...crudHandlers(models.networkType, 'NetworkType', null, ['list', 'load']),
  ...crudHandlers(models.reportingProtocol, 'ReportingProtocol', null, ['list', 'load']),

  // Users use the custom loadMyUser operation to access their own user
  // Only admin users have access to the loadUser operation
  // All users need access to update their email/password, so the updateUser operation
  // is not protected by the permission, which only admins have
  ...crudHandlers(models.user, 'User', null, ['create', 'list', 'load', 'remove']),

  // User custom endpoints
  ...require('./resources/user').handlers,

  // Session custom endpoints
  ...require('./resources/session').handlers,

  // Application custom endpoints
  ...require('./resources/application').handlers,

  // Device custom endpoints
  ...require('./resources/device').handlers,

  // ApplicationNetworkTypeLink custom endpoints
  ...require('./resources/application-network-type-link').handlers,

  // DeviceNetworkTypeLink custom endpoints
  ...require('./resources/device-network-type-link').handlers,

  // DeviceProfile custom endpoints
  ...require('./resources/device-profile').handlers
}

module.exports = handlers
