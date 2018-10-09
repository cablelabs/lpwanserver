/***************************************************************************
 * This file outlines the API used by the upper layers to communicate with
 * a remote network.  Use this as a starting point to guide development of
 * support of a new networkProtocol.
 ***************************************************************************/

// The request is used to access remote networks via a REST API.
var request = require( 'request' );

// NCONF can be used to access settings specified in the config.hjson file.
var nconf = require( 'nconf' );

// General libraries in use in this module.
// AppLogger is a conole logger that adds timestamp, filename, and line number
// information.  Usage: appLogger.log( <string> );
var appLogger = require( '../lib/appLogger.js' );

//******************************************************************************
// Maps the standard remote network API to the <remote network> server.
// This is a cross-platform API that must remain consistent.
//******************************************************************************

// The login account data needed to manipulate companies.
//
// dataAPI - The API that handles common data access and manipulation functions
//           on behalf of the protocol.  Defined in networkProtocolDataAccess.js
// network - The network that we are to get the account info for that gives
//           access at the "create company and company admin account" level.
//           Usually, this is an admin account on the remote network.
//
// Returns something that is passed to connect() as loginData to enable access
// with the appropriate permissions to the remote network.
exports.getCompanyAccessAccount = async function( dataAPI, network ) {
};

// The login account data needed to manipulate applications.
//
// dataAPI       - The API that handles common data access and manipulation
//                 functions on behalf of the protocol.
// network       - The network that we are to get the application account info
//                 for.
// applicationId - The id of the local application record.
//
// Returns something that is passed to connect() as loginData to enable access
// with the appropriate permissions to the remote network.
exports.getApplicationAccessAccount = async function( dataAPI, network, applicationId ) {
}

// The login account data needed to manipulate devices.
//
// dataAPI  - The API that handles common data access and manipulation
//            functions on behalf of the protocol.
// network  - The network that we are to get the application account info for.
// deviceId - The id of the local device record.
//
// Returns something that is passed to connect() as loginData to enable access
// with the appropriate permissions to the remote network.
exports.getDeviceAccessAccount = async function( dataAPI, network, deviceId ) {
}

// The login account data needed to manipulate deviceProfiles.
//
// dataAPI         - The API that handles common data access and manipulation
//                   functions on behalf of the protocol.
// network         - The network that we are to get the application account info
//                   for. For LoRa Server, this is a company account.
// deviceProfileId - The id of the local device record, used to get to the
//                   company.
//
// Returns something that is passed to connect() as loginData to enable access
// with the appropriate permissions to the remote network.
exports.getDeviceProfileAccessAccount = async function( dataAPI, network, deviceId ) {
}


//******************************************************************************
// Login/logout
//******************************************************************************

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
exports.connect = function( network, loginData ) {
    // Hint:
    //return new Promise( function( resolve, reject ) {
    //});
}

// Disconnect with the remote system.
//
// connection - The data top use to drop the connection
//
// Returns a Promise that disconnects from the remote system.
exports.disconnect = function( connection ) {
    // Hint:
    //return new Promise( function( resolve, reject ) {
    //});
}

//******************************************************************************
// CRUD companies.
//******************************************************************************

// Add company.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// companyId       - The companyNetworkTypeLinks record id for this company and
//                   network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and creates the
// company.  The promise saves the id for the remote company, linked to the
// local database record.  This method is called in an async manner against
// lots of other networks, so logging should be done via the dataAPI.
exports.addCompany = function( sessionData, network, companyId, dataAPI ) {
    // Hint:
    //return new Promise( async function( resolve, reject ) {
    //});
}

// Get company.
//
// sessionData - The session information for the user, including the //               connection data for the remote system.
// network     - The networks record for the network that uses this
//               protocol.
// companyId   - The id for the local company data, for which the remote data
//               will be retrieved.
// dataAPI     - Gives access to the data records and error tracking for the
//               operation.
//
// Returns a Promise that gets the company record from the remote system.
exports.getCompany = function( sessionData, network, companyId, dataAPI ) {
    // Hint:
    //return new Promise( async function( resolve, reject ) {
    //});
}

// Update company.
//
// sessionData - The session information for the user, including the //               connection data for the remote system.
// network     - The networks record for the network that uses this
//               protocol.
// companyId   - The id for the local company data, from which the remote data
//               will be updated.
// dataAPI     - Gives access to the data records and error tracking for the
//               operation.
//
// Returns a Promise that updates the company record on the remote system.
exports.updateCompany = function( sessionData, network, companyId, dataAPI ) {
    // Hint:
    //return new Promise( async function( resolve, reject ) {
    //});
}

// Delete the company.
//
// sessionData - The session information for the user, including the connection
//               data for the remote system.
// network     - The networks record for the network that uses this protocol.
// companyId   - The company to be deleted on the remote system.
// dataAPI     - Gives access to the data records and error tracking for the
//               operation.
//
// Returns a Promise that deletes the company record from the remote system.
exports.deleteCompany = function( sessionData, network, companyId, dataAPI ) {
    // Hint:
    //return new Promise( async function( resolve, reject ) {
    //});
}

// Push the company, meaning update if it exists, and create if it doesn't.
//
// sessionData - The session information for the user, including the connection
//               data for the remote system.
// network     - The networks record for the network that uses this protocol.
// companyId   - The company to be deleted on the remote system.
// dataAPI     - Gives access to the data records and error tracking for the
//               operation.
//
// Returns a Promise that pushes the company record to the remote system.
exports.pushCompany = function( sessionData, network, companyId, dataAPI ) {
    // Hint:
    //return new Promise( async function( resolve, reject ) {
    //});
}

// Pull all company data from the remote network.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
//
// Returns a Promise that pushes changes to the remote network of type.
exports.pullCompany = function( networkTypeId ) {
    // Hint:
    //return new Promise( async function( resolve, reject ) {
    //});
}


//******************************************************************************
// CRUD applications.
//******************************************************************************

// Add application.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// applicationId   - The application id for the application to create on the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and creates the
// application.  The promise saves the id for the remote application, linked to
// the local database record.  This method is called in an async manner against
// lots of other networks, so logging should be done via the dataAPI.
exports.addApplication = function( sessionData, network, applicationId, dataAPI ) {
}

// Get application.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// applicationId   - The application id for the application to create on the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and gets the
// application.  This method is called in an async manner against lots of other
// networks, so logging should be done via the dataAPI.
exports.getApplication = function( sessionData, network, applicationId, dataAPI ) {
}

// Update application.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// applicationId   - The application id for the application to create on the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and updates the
// application.  This method is called in an async manner against
// lots of other networks, so logging should be done via the dataAPI.
exports.updateApplication = function( sessionData, network, applicationId, dataAPI ) {
}

// Delete the application.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// applicationId   - The application id for the application to create on the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and deletes the
// application.  This method is called in an async manner against
// lots of other networks, so logging should be done via the dataAPI.
exports.deleteApplication = function( sessionData, network, applicationId, dataAPI ) {
}

// Push the application, meaning update if it exists, and create if it doesn't.
//
// sessionData   - The session information for the user, including the
//                 connection data for the remote system.
// network       - The networks record for the network that uses this protocol.
// applicationId - The company to be deleted on the remote system.
// dataAPI       - Gives access to the data records and error tracking for the
//                 operation.
//
// Returns a Promise that pushes the application record to the remote system.
exports.pushApplication = function( sessionData, network, applicationId, dataAPI ) {
}


//******************************************************************************
// Start/Stop Application data delivery.
//******************************************************************************
// Start the application.
//
// sessionData   - The session data to access the account on the network.
// network       - The networks record for the network that uses this
// applicationId - The application's record id.
// dataAPI       - Gives access to the data records and error tracking for the
//                 operation.
//
// Returns a Promise that starts the application data flowing from the remote
// system.
exports.startApplication = function( sessionData, network, applicationId, dataAPI ) {
};

// Stop the application.
//
// sessionData   - The session data to access the account on the network.
// network       - The networks record for the network that uses this protocol.
// applicationId - The local application's id to be stopped.
// dataAPI       - Gives access to the data records and error tracking for the
//                 operation.
//
// Returns a Promise that stops the application data flowing from the remote
// system.
exports.stopApplication = function( sessionData, network, applicationId, dataAPI ) {
};

//******************************************************************************
// CRUD deviceProfiles.
//******************************************************************************

// Add deviceProfile.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// deviceProfileId - The application id for the application to create on the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and creates the
// deviceProfile.  The promise saves the id for the remote deviceProfile,
// linked to the local database record.  This method is called in an async
// manner against lots of other networks, so logging should be done via the
// dataAPI.
exports.addDeviceProfile = function( sessionData, network, deviceProfileId, dataAPI ) {
}

// Get deviceProfile.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// deviceProfileId - The deviceProfile id for the deviceProfile to get from the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and gets the
// deviceProfile.  This method is called in an async manner against lots of other
// networks, so logging should be done via the dataAPI.
exports.getDeviceProfile = function( sessionData, network, deviceProfileId, dataAPI ) {
}

// Update deviceProfile.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// deviceProfileId - The deviceProfile id for the deviceProfile to update on the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and updates the
// deviceProfile.  This method is called in an async manner against
// lots of other networks, so logging should be done via the dataAPI.
exports.updateDeviceProfile = function( sessionData, network, deviceProfileId, dataAPI ) {
}

// Delete the deviceProfile.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// deviceProfileId - The application id for the deviceProfile to delete on the
//                   remote network.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that connects to the remote system and deletes the
// deviceProfile.  This method is called in an async manner against
// lots of other networks, so logging should be done via the dataAPI.
exports.deleteDeviceProfile = function( sessionData, network, deviceProfileId, dataAPI ) {
}

// Push the deviceProfile, meaning update if it exists, and create if it
// doesn't.
//
// sessionData     - The session information for the user, including the
//                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// deviceProfileId - The company to be deleted on the remote system.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that pushes the application record to the remote system.
exports.pushDeviceProfile = function( sessionData, network, deviceProfileId, dataAPI ) {
}


//******************************************************************************
// CRUD devices.
//******************************************************************************

// Add device.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
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
exports.addDevice = function( sessionData, network, deviceId, dataAPI ) {
}

// Get device.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
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
exports.getDevice = function( sessionData, network, deviceId, dataAPI ) {
}

// Update device.
//
// sessionData - The session information for the user, including the connection //               data for the remote system.
// network     - The networks record for the network that uses this protocol.
// deviceId    - The device id for the device to create on the remote network.
// dataAPI     - Gives access to the data records and error tracking for the
//               operation.
//
// Returns a Promise that connects to the remote system and updates the
// device.  This method is called in an async manner against lots of other
// networks, so logging should be done via the dataAPI.
exports.updateDevice = function( sessionData, network, deviceId, dataAPI ) {
}

// Delete the device.
//
// sessionData     - The session information for the user, including the //                   connection data for the remote system.
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
exports.deleteDevice = function( sessionData, network, deviceId, dataAPI ) {
}

// Push the device, meaning update if it exists, and create if it doesn't.
//
// sessionData     - The session information for the user, including the
//                   connection data for the remote system.
// network         - The networks record for the network that uses this
//                   protocol.
// deviceId        - The device to be deleted on the remote system.
// dataAPI         - Gives access to the data records and error tracking for the
//                   operation.
//
// Returns a Promise that pushes the device record to the remote system.
exports.pushDevice = function( sessionData, network, deviceId, dataAPI ) {
}
