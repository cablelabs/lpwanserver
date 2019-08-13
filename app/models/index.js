// Define the parts of the Model API

// Data models - what can be done with each data type.
var UserModel = require('./IUser')
var CompanyModel = require('./ICompany')
var PasswordPolicyModel = require('./IPasswordPolicy')
var SessionManagerModel = require('./Session')
var NetworkProtocolModel = require('./INetworkProtocol')
var NetworkModel = require('./INetwork')
var CompanyNetworkTypeLinkModel = require('./ICompanyNetworkTypeLink')
var ReportingProtocolModel = require('./IReportingProtocol')
var ApplicationModel = require('./IApplication')
var ApplicationNetworkTypeLinkModel = require('./IApplicationNetworkTypeLink')
var DeviceProfileModel = require('./IDeviceProfile')
var DeviceModel = require('./IDevice')
var DeviceNetworkTypeLinkModel = require('./IDeviceNetworkTypeLink')
var NetworkTypeModel = require('./INetworkType')
var NetworkProviderModel = require('./INetworkProvider')
var ProtocolDataModel = require('./IProtocolData')
var EmailModel = require('./IEmail')

// Network Protocol use.
var NetworkTypeAPI = require('../networkProtocols/networkTypeApi')
var NetworkProtocolAPI = require('../networkProtocols/networkProtocols')

function ModelAPI () {
  // Companies.
  this.companies = new CompanyModel(this)

  // Password policies.  Manages password rules for companies.
  this.passwordPolicies = new PasswordPolicyModel(this.companies)

  // Users.  And start the user email verification background task that
  // expires old email verification records.
  this.users = new UserModel(this)

  this.emails = new EmailModel(this.users)

  // The session model, which uses users (for login).
  this.sessions = new SessionManagerModel(this.users)

  // The networkProtocol model.
  this.networkProtocols = new NetworkProtocolModel()

  // The network model.  Needs the protocols to access the correct api.
  this.networks = new NetworkModel(this)

  // The network provider model.
  this.networkProviders = new NetworkProviderModel()

  // The network type model.
  this.networkTypes = new NetworkTypeModel()

  // The NetworkProvisioningFields model.
  // this.networkProvisioningFields = new NetworkProvisioningFieldModel();

  // The reportingProtocol model.
  this.reportingProtocols = new ReportingProtocolModel()

  // The applicationNetworkTypeLink model.
  this.applicationNetworkTypeLinks = new ApplicationNetworkTypeLinkModel(this)

  // The application model.
  this.applications = new ApplicationModel(this)

  // The networkProtocol API, giving access to a specific remote network.
  this.networkProtocolAPI = new NetworkProtocolAPI(this)

  // The networkType API, giving access to the various remote networks of a
  // given type.
  this.networkTypeAPI = new NetworkTypeAPI(this)

  // The companyNetworkTypeLink model.
  this.companyNetworkTypeLinks = new CompanyNetworkTypeLinkModel(this)

  // The deviceProfile model.
  this.deviceProfiles = new DeviceProfileModel(this)

  // The device model.  It uses applications for some validation.
  this.devices = new DeviceModel(this)

  // The applicationNetworkTypeLink model.
  this.deviceNetworkTypeLinks = new DeviceNetworkTypeLinkModel(this)

  // The helper interface for network protocols to use.
  this.protocolData = new ProtocolDataModel(this)
}

ModelAPI.prototype.initialize = async function initializeModelAPI () {
  await this.networkProtocols.initialize(this)
  await this.reportingProtocols.initialize()
  await this.users.init()
  await this.emails.init()
}

module.exports = new ModelAPI()
