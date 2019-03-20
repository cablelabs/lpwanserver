// Define the parts of the Model API

// General libraries in use in this module.
var appLogger = require('../lib/appLogger.js')

// Data models - what can be done with each data type.
var UserModel = require('./IUser.js')
var CompanyModel = require('./ICompany.js')
var PasswordPolicyModel = require('./IPasswordPolicy.js')
var SessionManagerModel = require('./sessionManager.js')
var NetworkProtocolModel = require('./INetworkProtocol.js')
var NetworkModel = require('./INetwork.js')
var CompanyNetworkTypeLinkModel = require('./ICompanyNetworkTypeLink.js')
// var NetworkProvisioningFieldModel = require( './models/INetworkProvisioningField.js' );
var ReportingProtocolModel = require('./IReportingProtocol.js')
var ApplicationModel = require('./IApplication.js')
var ApplicationNetworkTypeLinkModel = require('./IApplicationNetworkTypeLink.js')
var DeviceProfileModel = require('./IDeviceProfile.js')
var DeviceModel = require('./IDevice.js')
var DeviceNetworkTypeLinkModel = require('./IDeviceNetworkTypeLink.js')
var NetworkTypeModel = require('./INetworkType.js')
var NetworkProviderModel = require('./INetworkProvider.js')
var ProtocolDataModel = require('./IProtocolData.js')

// Network Protocol use.
var NetworkTypeAPI = require('../networkProtocols/networkTypeApi.js')
var NetworkProtocolAPI = require('../networkProtocols/networkProtocols.js')

// Reporting Protocol use.
var ReportingProtocols = require('../reportingProtocols/reportingProtocols.js')

var modelAPI

function ModelAPI (app) {
  // Based on the initialization type, create the models that will
  // use the underlying data.  Each module gets the type from nconf.
  // Pass around the dependancies as well.
  modelAPI = this

  // Companies.
  this.companies = new CompanyModel(this)

  // Password policies.  Manages password rules for companies.
  this.passwordPolicies = new PasswordPolicyModel(this.companies)

  // Users.  And start the user email verification background task that
  // expires old email verification records.
  this.users = new UserModel()
  this.users.emailVerifyInit()

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

  // The application model.  Needs the express app because when it starts, it
  // may need to add new endpoints to receive data from remote networks.
  this.applications = new ApplicationModel(app, this)

  // The networkType API, giving access to the various remote networks of a
  // given type.
  this.networkTypeAPI = new NetworkTypeAPI(this)

  // The networkProtocol API, giving access to a specific remote network.
  this.networkProtocolAPI = new NetworkProtocolAPI(this)

  // The companyNetworkTypeLink model.
  this.companyNetworkTypeLinks = new CompanyNetworkTypeLinkModel(this)

  this.reportingProtocolAPIs = new ReportingProtocols(this.reportingProtocols)

  // The deviceProfile model.
  this.deviceProfiles = new DeviceProfileModel(this)

  // The device model.  It uses applications for some validation.
  this.devices = new DeviceModel(this)

  // The applicationNetworkTypeLink model.
  this.deviceNetworkTypeLinks = new DeviceNetworkTypeLinkModel(this)

  // The helper interface for network protocols to use.
  this.protocolData = new ProtocolDataModel(this)
}

module.exports = ModelAPI
