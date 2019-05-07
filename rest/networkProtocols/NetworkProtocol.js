/***************************************************************************
 * This file outlines the API used by the upper layers to communicate with
 * a remote network.  Use this as a starting point to guide development of
 * support of a new networkProtocol.
 ***************************************************************************/

// AppLogger is a conole logger that adds timestamp, filename, and line number
// information.  Usage: appLogger.log( <string> );
var appLogger = require('../lib/appLogger.js')

//* *****************************************************************************
// Maps the standard remote network API to the <remote network> server.
// This is a cross-platform API that must remain consistent.
//* *****************************************************************************

module.exports = class NetworkProtocol {
  constructor () {
    this.activeApplicationNetworkProtocols = {}
  }

  //* *****************************************************************************
  // Login/logout
  //* *****************************************************************************

  // Initiate the session with the remote network
  connect () {
    throw new Error('Connect method not implemented by network protocol handler.')
  }

  // Disconnect with the remote system.
  disconnect () {
    // override this method if the protocol supports logout
  }

  test () {
    throw new Error('Test method not implemented by network protocol handler.')
  }

  //* *****************************************************************************
  // CRUD companies.
  //* *****************************************************************************

  // Add company.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // companyId       - The companyNetworkTypeLinks record id for this company and
  //                   network.
  //
  // Returns a Promise that connects to the remote system and creates the
  // company.  The promise saves the id for the remote company, linked to the
  // local database record.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  addCompany () {
    return {}
  }

  // Get company.
  //
  // network     - The networks record for the network that uses this
  //               protocol.
  // companyId   - The id for the local company data, for which the remote data
  //               will be retrieved.
  //
  // Returns a Promise that gets the company record from the remote system.
  getCompany () {
    return {}
  }

  // Update company.
  //
  // network     - The networks record for the network that uses this
  //               protocol.
  // companyId   - The id for the local company data, from which the remote data
  //               will be updated.
  //
  // Returns a Promise that updates the company record on the remote system.
  updateCompany () {
    return {}
  }

  // Delete the company.
  //
  // network     - The networks record for the network that uses this protocol.
  // companyId   - The company to be deleted on the remote system.
  //
  // Returns a Promise that deletes the company record from the remote system.
  deleteCompany () {
    return {}
  }

  // Push the company, meaning update if it exists, and create if it doesn't.
  //
  // network     - The networks record for the network that uses this protocol.
  // companyId   - The company to be deleted on the remote system.
  //
  // Returns a Promise that pushes the company record to the remote system.
  pushCompany () {
    return {}
  }

  // Pull all company data from the remote network.
  //
  // networkTypeId - The networkTypes record id  identifying the networks to push
  //                 to.
  //
  // Returns a Promise that pushes changes to the remote network of type.
  pullCompany () {
    return {}
  }

  //* *****************************************************************************
  // CRUD applications.
  //* *****************************************************************************

  // Add application.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and creates the
  // application.  The promise saves the id for the remote application, linked to
  // the local database record.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  addApplication () {
  }

  // Get application.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and gets the
  // application.  This method is called in an async manner against lots of other
  // networks, so logging should be done via the dataAPI.
  getApplication () {
  }

  // Update application.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and updates the
  // application.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  updateApplication () {
  }

  // Delete the application.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // applicationId   - The application id for the application to create on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and deletes the
  // application.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  deleteApplication () {
  }

  // Push the application, meaning update if it exists, and create if it doesn't.
  //
  // network       - The networks record for the network that uses this protocol.
  // applicationId - The company to be deleted on the remote system.
  //
  // Returns a Promise that pushes the application record to the remote system.
  pushApplication () {
  }

  //* *****************************************************************************
  // Start/Stop Application data delivery.
  //* *****************************************************************************
  // Start the application.
  //
  // network       - The networks record for the network that uses this
  // applicationId - The application's record id.
  //
  // Returns a Promise that starts the application data flowing from the remote
  // system.
  startApplication () {
  }

  // Stop the application.
  //
  // network       - The networks record for the network that uses this protocol.
  // applicationId - The local application's id to be stopped.
  //
  // Returns a Promise that stops the application data flowing from the remote
  // system.
  stopApplication () {
  }

  // Pass data to application
  async passDataToApplication (network, appId, data, dataAPI) {
    var reportingAPI = await dataAPI.getReportingAPIByApplicationId(appId)
    var deviceId
    if (data.devEUI) {
      var recs = await dataAPI.getProtocolDataWithData(
        network.id,
        'dev:%/devNwkId',
        data.devEUI
      )
      if (recs && (recs.length > 0)) {
        let splitOnSlash = recs[0].dataIdentifier.split('/')
        let splitOnColon = splitOnSlash[0].split(':')
        deviceId = parseInt(splitOnColon[1], 10)

        let device = await dataAPI.getDeviceById(deviceId)
        data.deviceInfo = R.pick(['name', 'description'], device)
        data.deviceInfo.model = device.deviceModel
      }
    }

    let app = await dataAPI.getApplicationById(appId)

    data.applicationInfo = { name: app.name }
    data.networkInfo = { name: network.name }
    await reportingAPI.report(data, app.baseUrl, app.name)
  }

  //* *****************************************************************************
  // CRUD deviceProfiles.
  //* *****************************************************************************

  // Add deviceProfile.
  //
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
  addDeviceProfile () {
  }

  // Get deviceProfile.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The deviceProfile id for the deviceProfile to get from the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and gets the
  // deviceProfile.  This method is called in an async manner against lots of other
  // networks, so logging should be done via the dataAPI.
  getDeviceProfile () {
  }

  // Update deviceProfile.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The deviceProfile id for the deviceProfile to update on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and updates the
  // deviceProfile.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  updateDeviceProfile () {
  }

  // Delete the deviceProfile.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The application id for the deviceProfile to delete on the
  //                   remote network.
  //
  // Returns a Promise that connects to the remote system and deletes the
  // deviceProfile.  This method is called in an async manner against
  // lots of other networks, so logging should be done via the dataAPI.
  deleteDeviceProfile () {
  }

  // Push the deviceProfile, meaning update if it exists, and create if it
  // doesn't.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceProfileId - The company to be deleted on the remote system.
  //
  // Returns a Promise that pushes the application record to the remote system.
  pushDeviceProfile () {
  }

  //* *****************************************************************************
  // CRUD devices.
  //* *****************************************************************************

  // Add device.
  //
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
  addDevice () {
  }

  // Get device.
  //
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
  getDevice () {
  }

  // Update device.
  //
  // network     - The networks record for the network that uses this protocol.
  // deviceId    - The device id for the device to create on the remote network.
  //
  // Returns a Promise that connects to the remote system and updates the
  // device.  This method is called in an async manner against lots of other
  // networks, so logging should be done via the dataAPI.
  updateDevice () {
  }

  // Delete the device.
  //
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
  deleteDevice () {
  }

  // Push the device, meaning update if it exists, and create if it doesn't.
  //
  // network         - The networks record for the network that uses this
  //                   protocol.
  // deviceId        - The device to be deleted on the remote system.
  //
  // Returns a Promise that pushes the device record to the remote system.
  pushDevice () {
  }
}
