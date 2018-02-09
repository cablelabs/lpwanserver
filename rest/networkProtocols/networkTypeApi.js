// General libraries in use in this module.
var appLogger = require( '../lib/appLogger.js' );

// An object to access dataModel data and cache it for operations across
// multiple networks, preventing a lot of redundant database hits.
var NetworkProtocolDataAccess = require( './networkProtocolDataAccess.js' );

// An object to access and cache the protocols for the various network types.
var NetworkProtocols = require( './networkProtocols.js' );

// The dataModel API.
var modelAPI;

// The protocol access API.
var protos;

//******************************************************************************
// Defines the generic cross-network API from the perspective of a networkType,
// that propogates calls the the individual networks on behalf of the caller.
//******************************************************************************
function NetworkTypeApi( dataModel  ) {
    modelAPI = dataModel;
    protos = new NetworkProtocols( dataModel.networkProtocols );
}

// Most of the operations here have the same format:
//
// 1) Create a Promise that:
// 2) Load a set of networks of a type, and
// 3) For each network, create a Promise to do an operation on that network,
// 4) Execute the created promises in parallel until all complete, and
// 5) Return the log messages from the remote netowrk accesses.
//
// The difference being the actual operations being performed.  This function
// handles all of the common parts.
//
// operationName    - The name of the operation, used by the
//                    NetworkProtocolDataAccess object.
// networkTypeId    - Used to get the set of networks we'll run this operation
//                    against.
// operationFunction - A callback function that returns a promise for the passed
//                     network, using the passed NetworkProtocolDataAccess.
function createPromiseOperationForNetworksOfType( operationName,
                                                  networkTypeId,
                                                  operationFunction ) {
    return new Promise( async function( resolve, reject ) {
        // Get the data access object/cache set up for this operation across all
        // networks associated with the networkType.  This object keeps a cache
        // of local database queries, keeps track of log messages, and provides
        // a key/value store for the network protocols to store data regarding
        // useful data for the remote network (e.g., the id for the remote
        // company, admin account credetials for the company).
        var npda = new NetworkProtocolDataAccess( modelAPI, operationName );

        var networks;
        try {
            // Get the networks we'll be operating on that support the
            // networkType.
            var networks = await npda.getNetworksOfType( networkTypeId );
        }
        catch ( err ) {
            npda.addLog( "Error retrieving networks for type ID " + networkTypeId );
            resolve( npda.getLogs() );
            return;
        }

        // Set up the promises that will do the creates for each network - we'll
        // do an 'all' operation on these so they can run simultaneously.
        var netOperations = [];
        networks.records.forEach( function( network ) {
            // Push the promise to execute the operation.
            netOperations.push( operationFunction( npda, network ) );
        });
        // Run, and wait for it...
        await Promise.all( netOperations ).then( function( rets ) {
            // Retrieve the logging for the operations, intended for
            // presentation for the user.
            var logs = npda.getLogs();
            if ( logs && ( logs.length > 0 ) ) {
                // Also put the log messages into our logging.
                appLogger.log( logs );
            }
            resolve( logs );
        })
        .catch( function( err ) {
            // Error in trying to run the global promise (as opposed to errors
            // in accessing each network).
            npda.addLog( "Error on " + operationName + " propogation to networks: " + err );
            resolve( npda.getLogs() );
        });
    });

}

//******************************************************************************
// Add/Push/Delete remote companies.
//******************************************************************************

// Add company.
//
// networkTypeId - The id of the networkType to get the new company.
// companyId     - The id for the companies record.
//
// Returns a Promise that connects to the remote systems and creates the
// company.
NetworkTypeApi.prototype.addCompany = function( networkTypeId, companyId ) {
    return createPromiseOperationForNetworksOfType(
                "Create Company",
                networkTypeId,
                function( npda, network ) {
                    return protos.addCompany( npda, network, companyId );
                });
}

// Push the local company data to the remote companies by "pushing" changes.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// companyId     - The companyId for the company to "push" to the remote network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushCompany = function( networkTypeId, companyId ) {
    return createPromiseOperationForNetworksOfType(
                "Push Company",
                networkTypeId,
                function( npda, network ) {
                    return protos.pushCompany( npda, network, companyId );
                });
}

// Delete the company.
//
// networkTypeId - The networkTypes record id identifying the networks to delete
//                 the company from.
// companyId     - The companyid of the company to delete remotely.
//                 and network.
//
// Returns a Promise that deletes the company record from the remote system.
NetworkTypeApi.prototype.deleteCompany = function( networkTypeId, companyId ) {
    return createPromiseOperationForNetworksOfType(
                "Delete Company",
                networkTypeId,
                function( npda, network ) {
                    return protos.deleteCompany( npda, network, companyId );
                });
}

//******************************************************************************
// Add/Push/Delete remote applications.
//******************************************************************************

// Add application.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// applicationId - The applicationId for the application to add to the remote
//                 network.
//
// Returns a Promise that connects to the remote systems and creates the
// application.
NetworkTypeApi.prototype.addApplication = function( networkTypeId, applicationId ) {
    return createPromiseOperationForNetworksOfType(
                "Create Application",
                networkTypeId,
                function( npda, network ) {
                    return protos.addApplication( npda, network, applicationId );
                });
}

// Push the local application data to the remote networks by "pushing" changes.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// applicationId - The applicationId for the application to "push" to the remote
//                 network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushApplication = function( networkTypeId, applicationId ) {
    return createPromiseOperationForNetworksOfType(
                "Push Application",
                networkTypeId,
                function( npda, network ) {
                    return protos.pushApplication( npda, network, applicationId );
                });
}

// Delete the application.
//
// networkTypeId - The networkTypes record id identifying the networks to delete
//                 the application from.
// applicationId - The applicationId of the application to delete remotely.
//
// Returns a Promise that deletes the application record from the remote system.
NetworkTypeApi.prototype.deleteApplication = function( networkTypeId, applicationId ) {
    return createPromiseOperationForNetworksOfType(
                "Delete Application",
                networkTypeId,
                function( npda, network ) {
                    return protos.deleteApplication( npda, network, applicationId );
                });
}

//******************************************************************************
// Start/Stop Application data delivery.
//******************************************************************************
// Start the application.
//
// network         - The networks record for the network that uses this
//                   protocol.
// companyData     - The companyNetworkTypeLinks record for this company and
//                   network.
// application     - The applications record.
// applicationData - The applicationNetworkTypeLinks record for this Application
//                   and network.
// deliveryFunc    - The function to call with new data.
//
// Returns a Promise that starts the application data flowing from the remote
// system.
NetworkTypeApi.prototype.startApplication = function( networkTypeId, applicationId ) {
    return createPromiseOperationForNetworksOfType(
                "Start Application",
                networkTypeId,
                function( npda, network ) {
                    return protos.startApplication( npda, network, applicationId );
                });
};

// Stop the application.
//
// network         - The networks record for the network that uses this
//                   protocol.
// companyData     - The companyNetworkTypeLinks record for this company and
//                   network.
// application     - The applications record.
// applicationData - The applicationNetworkTypeLinks record for this Application
//                   and network.
//
// Returns a Promise that stops the application data flowing from the remote
// system.
NetworkTypeApi.prototype.stopApplication = function( networkTypeId, applicationId ) {
    return createPromiseOperationForNetworksOfType(
                "Stop Application",
                networkTypeId,
                function( npda, network ) {
                    return protos.stopApplication( npda, network, applicationId );
                });
};

//******************************************************************************
// Add/Push/Delete remote deviceProfiles.
//******************************************************************************

// Add deviceProfile.
//
// networkTypeId   - The networkTypes record id identifying the networks to push
//                   to.
// deviceProfileId - The deviceProfileId for the deviceProfile to add to the
//                   remote network.
//
// Returns a Promise that connects to the remote systems and creates the
// deviceProfile.
NetworkTypeApi.prototype.addDeviceProfile = function( networkTypeId, deviceProfileId  ) {
    return createPromiseOperationForNetworksOfType(
                "Create DeviceProfile",
                networkTypeId,
                function( npda, network ) {
                    return protos.addDeviceProfile( npda, network, deviceProfileId );
                });
}

// Push the local deviceProfile data to the remote networks by "pushing"
// changes.
//
// networkTypeId   - The networkTypes record id  identifying the networks to
//                   push to.
// deviceProfileId - The deviceProfileId for the deviceProfile to "push" to the
//                   remote network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushDeviceProfile = function( networkTypeId, deviceProfileId ) {
    return createPromiseOperationForNetworksOfType(
                "Push DeviceProfile",
                networkTypeId,
                function( npda, network ) {
                    return protos.pushDeviceProfile( npda, network, deviceProfileId );
                });
}

// Delete the deviceProfile.
//
// networkTypeId   - The networkTypes record id identifying the networks to delete
//                   delete the deviceProfile from.
// deviceProfileId - The deviceProfileId of the deviceProfile to delete remotely.
//
// Returns a Promise that deletes the deviceProfile record from the remote system.
NetworkTypeApi.prototype.deleteDeviceProfile = function( networkTypeId, deviceProfileId ) {
    return createPromiseOperationForNetworksOfType(
                "Delete DeviceProfile",
                networkTypeId,
                function( npda, network ) {
                    return protos.deleteDeviceProfile( npda, network, deviceProfileId );
                });
}

//******************************************************************************
// Add/Push/Delete remote devices.
//******************************************************************************

// Add device.
//
// networkTypeId - The networkTypes record id identifying the networks to push
//                 to.
// deviceId      - The deviceId for the device to add to the remote network.
//
// Returns a Promise that connects to the remote systems and creates the
// device.
NetworkTypeApi.prototype.addDevice = function( networkTypeId, deviceId ) {
    return createPromiseOperationForNetworksOfType(
                "Create Device",
                networkTypeId,
                function( npda, network ) {
                    return protos.addDevice( npda, network, deviceId );
                });
}

// Push the local device data to the remote networks by "pushing" changes.
//
// networkTypeId - The networkTypes record id  identifying the networks to push
//                 to.
// deviceId      - The deviceId for the device to "push" to the remote network.
//
// Returns a Promise that pushes changes to the remote network of type.
NetworkTypeApi.prototype.pushDevice = function( networkTypeId, deviceId ) {
    return createPromiseOperationForNetworksOfType(
                "Push Device",
                networkTypeId,
                function( npda, network ) {
                    return protos.pushDevice( npda, network, deviceId );
                });
}

// Delete the device.
//
// networkTypeId - The networkTypes record id identifying the networks to delete
//                 the device from.
// deviceId      - The deviceId of the device to delete remotely.
//
// Returns a Promise that deletes the device record from the remote system.
NetworkTypeApi.prototype.deleteDevice = function( networkTypeId, deviceId ) {
    return createPromiseOperationForNetworksOfType(
                "Delete Device",
                networkTypeId,
                function( npda, network ) {
                    return protos.deleteDevice( npda, network, deviceId );
                });
}


module.exports = NetworkTypeApi;
