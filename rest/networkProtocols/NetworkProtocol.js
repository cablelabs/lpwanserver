/***************************************************************************
 * This file outlines the API used by the upper layers to communicate with
 * a remote network.  Use this as a starting point to guide development of
 * support of a new networkProtocol.
 ***************************************************************************/

// The request is used to access remote networks via a REST API.
var request = require('request-promise')
// NCONF can be used to access settings specified in the config.hjson file.
var nconf = require('nconf')
// AppLogger is a conole logger that adds timestamp, filename, and line number
// information.  Usage: appLogger.log( <string> );
var appLogger = require('../lib/appLogger.js')

//* *****************************************************************************
// Maps the standard remote network API to the <remote network> server.
// This is a cross-platform API that must remain consistent.
//* *****************************************************************************

module.exports = class NetworkProtocol {
  // The login account data needed to manipulate companies.
  //
  // network - The network that we are to get the account info for that gives
  //           access at the "create company and company admin account" level.
  //           Usually, this is an admin account on the remote network.
  //
  // Returns something that is passed to connect() as loginData to enable access
  // with the appropriate permissions to the remote network.
  getCompanyAccessAccount (network) {
    const { securityData } = network
    if (!securityData || !securityData.username || !securityData.password) {
      appLogger.log('Network security data is incomplete for ' + network.name)
      appLogger.log('Network security data is incomplete for ' + network.name)
      return null
    }
    return securityData
  }

  // Placeholder
  // The default behavior is for networks that don't support companies
  getCompanyAccount (network, dataAPI, companyId, generateIfMissing) {
    return this.getCompanyAccessAccount(network)
  }

  // The login account data needed to manipulate applications.
  //
  // network       - The network that we are to get the application account info
  //                 for.
  // applicationId - The id of the local application record.
  //
  // Returns something that is passed to connect() as loginData to enable access
  // with the appropriate permissions to the remote network.
  async getApplicationAccessAccount (network, dataAPI, applicationId) {
    const co = await dataAPI.getCompanyByApplicationId(applicationId)
    return this.getCompanyAccount(dataAPI, network, co.id, false)
  }

  // The login account data needed to manipulate devices.
  //
  // network  - The network that we are to get the application account info for.
  // deviceId - The id of the local device record.
  //
  // Returns something that is passed to connect() as loginData to enable access
  // with the appropriate permissions to the remote network.
  async getDeviceAccessAccount (network, dataAPI, deviceId) {
    const co = await dataAPI.getCompanyByDeviceId(deviceId)
    return this.getCompanyAccount(dataAPI, network, co.id, false)
  }

  // The login account data needed to manipulate deviceProfiles.
  //
  // network         - The network that we are to get the application account info
  //                   for. For LoRa Server, this is a company account.
  // deviceProfileId - The id of the local device record, used to get to the
  //                   company.
  //
  // Returns something that is passed to connect() as loginData to enable access
  // with the appropriate permissions to the remote network.
  async getDeviceProfileAccessAccount (network, dataAPI, deviceId) {
    const co = await dataAPI.getCompanyByDeviceProfileId(deviceId)
    return this.getCompanyAccount(dataAPI, network, co.id, false)
  }

  //* *****************************************************************************
  // Login/logout
  //* *****************************************************************************

  // Connect with the remote system.
  //
  // network     - The networks record for the network that uses this
  //               protocol.
  // loginData   - The companyNetworkTypeLinks record for this company and network.
  //
  // Returns a Promise that connects to the remote system.  We treat all
  // connections like a login session, and it is up to the code in this module
  // to implement that concept.  The promise returns the opaque session data to
  // be passed into other methods.
  async connect(network, loginData) {
    throw new Error('Connect method not implemented by network protocol handler.')
  }

  // Disconnect with the remote system.
  //
  // connection - The data top use to drop the connection
  //
  // Returns a Promise that disconnects from the remote system.
  disconnect (connection) {
    // override this method if the protocol supports logout
  }

  //* *****************************************************************************
  // CRUD companies.
  //* *****************************************************************************

  // Add company.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // companyId       - The companyNetworkTypeLinks record id for this company and
  //                   network.
  //
  // Returns a Promise that connects to the remote system and creates the
  // company.  The promise saves the id for the remote company, linked to the
  // local database record.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  addCompany (session, network, companyId, dataAPI) {
    return {}
  }

  // Get company.
  //
  // session - The session information for the user, including the //               connection data for the remote system.
  // network     - The networks record for the network that uses this
  //               protocol.
  // companyId   - The id for the local company data, for which the remote data
  //               will be retrieved.
  //
  // Returns a Promise that gets the company record from the remote system.
  getCompany (session, network, companyId) {
    return {}
  }

  // Update company.
  //
  // session - The session information for the user, including the //               connection data for the remote system.
  // network     - The networks record for the network that uses this
  //               protocol.
  // companyId   - The id for the local company data, from which the remote data
  //               will be updated.
  //
  // Returns a Promise that updates the company record on the remote system.
  updateCompany (session, network, companyId) {
    return {}
  }

  // Delete the company.
  //
  // session - The session information for the user, including the connection
  //               data for the remote system.
  // network     - The networks record for the network that uses this protocol.
  // companyId   - The company to be deleted on the remote system.
  //
  // Returns a Promise that deletes the company record from the remote system.
  deleteCompany (session, network, companyId) {
    return {}
  }

  // Push the company, meaning update if it exists, and create if it doesn't.
  //
  // session - The session information for the user, including the connection
  //               data for the remote system.
  // network     - The networks record for the network that uses this protocol.
  // companyId   - The company to be deleted on the remote system.
  //
  // Returns a Promise that pushes the company record to the remote system.
  pushCompany (session, network, companyId) {
    return {}
  }

  // Pull all company data from the remote network.
  //
  // networkTypeId - The networkTypes record id  identifying the networks to push
  //                 to.
  //
  // Returns a Promise that pushes changes to the remote network of type.
  pullCompany (networkTypeId) {
    return {}
  }

  //* *****************************************************************************
  // CRUD applications.
  //* *****************************************************************************

  // Add application.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and creates the
  // application.  The promise saves the id for the remote application, linked to
  // the local database record.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  addApplication (session, network, applicationId) {
  }

  // Get application.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and gets the
  // application.  This method is called in an async manner against lots of other
  // networks, so logging should be done via the dataAPI.
  getApplication (session, network, applicationId) {
  }

  // Update application.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and updates the
  // application.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  updateApplication (session, network, applicationId) {
  }

  // Delete the application.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and deletes the
  // application.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  deleteApplication (session, network, applicationId) {
  }

  // Push the application, meaning update if it exists, and create if it doesn't.
  //
  // session   - The session information for the user, including the
  //                 connection data for the remote system.
  // network       - The networks record for the network that uses this protocol.
  // applicationId - The company to be deleted on the remote system.
  //
  // Returns a Promise that pushes the application record to the remote system.
  pushApplication (session, network, applicationId) {
  }

  //* *****************************************************************************
  // Start/Stop Application data delivery.
  //* *****************************************************************************
  // Start the application.
  //
  // session   - The session data to access the account on the network.
  // network       - The networks record for the network that uses this
  // applicationId - The application's record id.
  //
  // Returns a Promise that starts the application data flowing from the remote
  // system.
  startApplication (session, network, applicationId) {
  }

  // Stop the application.
  //
  // session   - The session data to access the account on the network.
  // network       - The networks record for the network that uses this protocol.
  // applicationId - The local application's id to be stopped.
  //
  // Returns a Promise that stops the application data flowing from the remote
  // system.
  stopApplication (session, network, applicationId) {
  }

  //* *****************************************************************************
  // CRUD deviceProfiles.
  //* *****************************************************************************

  // Add deviceProfile.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and creates the
  // deviceProfile.  The promise saves the id for the remote deviceProfile,
  // linked to the local database record.  This method is called in an async
  // manner against lots of other networks, so logging should be done via the
  // dataAPI.
  addDeviceProfile (session, network, deviceProfileId) {
  }

  // Get deviceProfile.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The deviceProfile id for the deviceProfile to get from the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and gets the
  // deviceProfile.  This method is called in an async manner against lots of other
  // networks, so logging should be done via the dataAPI.
  getDeviceProfile (session, network, deviceProfileId) {
  }

  // Update deviceProfile.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The deviceProfile id for the deviceProfile to update on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and updates the
  // deviceProfile.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  updateDeviceProfile (session, network, deviceProfileId) {
  }

  // Delete the deviceProfile.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The application id for the deviceProfile to delete on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and deletes the
  // deviceProfile.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  deleteDeviceProfile (session, network, deviceProfileId) {
  }

  // Push the deviceProfile, meaning update if it exists, and create if it
  // doesn't.
  //
  // session     - The session information for the user, including the
  //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The company to be deleted on the remote system.
  //
  // Returns a Promise that pushes the application record to the remote system.
  pushDeviceProfile (session, network, deviceProfileId) {
  }

  //* *****************************************************************************
  // CRUD devices.
  //* *****************************************************************************

  // Add device.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // companyData     - The companyNetworkTypeLinks record for this company and
  //                   network.
  // applicationData - The applicationNetworkTypeLinks record for this device's
  //                   Application and network.
  // device          - The device record.
  // deviceData      - The deviceNetworkTypeLinks record for this device
  //                   and network.
  //
  // Returns a Promise that connects to the remote system and creates the
  // device.  The promise returns the id of the created device to be added to the
  // deviceNetworkTypeLinks record by the caller.
  addDevice (session, network, deviceId) {
  }

  // Get device.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // companyData     - The companyNetworkTypeLinks record for this company and
  //                   network.
  // applicationData - The applicationNetworkTypeLinks record for this device's
  //                   Application and network.
  // device          - The device record.
  // deviceData      - The deviceNetworkTypeLinks record for this device
  //                   and network.
  //
  // Returns a Promise that gets the device data from the remote system.
  getDevice (session, network, deviceId) {
  }

  // Update device.
  //
  // session - The session information for the user, including the connection //               data for the remote system.
  // network     - The networks record for the network that uses this protocol.
  // deviceId    - The device id for the device to create on the remote network.
  //
  // Returns a Promise that connects to the remote system and updates the
  // device.  This method is called in an async manner against lots of other
  // networks, so logging should be done via the dataAPI.
  updateDevice (session, network, deviceId) {
  }

  // Delete the device.
  //
  // session     - The session information for the user, including the //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // companyData     - The companyNetworkTypeLinks record for this company and
  //                   network.
  // applicationData - The applicationNetworkTypeLinks record for this device's
  //                   Application and network.
  // device          - The device record.
  // deviceData      - The deviceNetworkTypeLinks record for this device
  //                   and network.
  //
  // Returns a Promise that gets the application record from the remote system.
  deleteDevice (session, network, deviceId) {
  }

  // Push the device, meaning update if it exists, and create if it doesn't.
  //
  // session     - The session information for the user, including the
  //                   connection data for the remote system.
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceId        - The device to be deleted on the remote system.
  //
  // Returns a Promise that pushes the device record to the remote system.
  pushDevice (session, network, deviceId) {
  }
}


