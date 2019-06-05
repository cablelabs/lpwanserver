// Define the parts of the Model API

// Data models - what can be done with each data type.
var UserModel = require('./IUser.js')
var CompanyModel = require('./ICompany.js')
var PasswordPolicyModel = require('./IPasswordPolicy.js')
var SessionManagerModel = require('./sessionManager.js')
var NetworkProtocolModel = require('./INetworkProtocol.js')
var NetworkModel = require('./INetwork.js')
var CompanyNetworkTypeLinkModel = require('./ICompanyNetworkTypeLink.js')
var ReportingProtocolModel = require('./IReportingProtocol.js')
var { Application: ApplicationModel } = require('./IApplication.js')
var ApplicationNetworkTypeLinkModel = require('./IApplicationNetworkTypeLink.js')
var DeviceProfileModel = require('./IDeviceProfile.js')
var DeviceModel = require('./IDevice.js')
var DeviceNetworkTypeLinkModel = require('./IDeviceNetworkTypeLink.js')
var NetworkTypeModel = require('./INetworkType.js')
var NetworkProviderModel = require('./INetworkProvider.js')
var ProtocolDataModel = require('./IProtocolData.js')
var EmailModel = require('./IEmail.js')
const appLogger = require('../lib/appLogger')

// Network Protocol use.
var NetworkTypeAPI = require('../networkProtocols/networkTypeApi.js')
var NetworkProtocolAPI = require('../networkProtocols/networkProtocols.js')

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
  // await Promise.all([
  //   this.networkProtocols.initialize(this),
  //   this.reportingProtocols.initialize(),
  //   this.users.init(),
  //   this.emails.init()
  // ])

  await this.networkProtocols.initialize(this)
  appLogger.log('NETWORK PROTOCOLS INITIALIZED')
  await this.reportingProtocols.initialize()
  appLogger.log('REPORTING PROTOCOLS INITIALIZED')
  await this.users.init()
  appLogger.log('USERS INITIALIZED')
  await this.emails.init()
  appLogger.log('EMAILS INITIALIZED')
}

module.exports = ModelAPI
