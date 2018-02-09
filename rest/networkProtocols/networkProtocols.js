// General libraries in use in this module.
var appLogger = require( '../lib/appLogger.js' );

var request = require('request');

//******************************************************************************
// Defines the generic cross-network API, and manages the network protocols
// for the upper layers.
//******************************************************************************

var networkProtocolMap;

// Constructor - gets the database API for the networkProtocols
function NetworkProtocolAccess( networkProtocolAPI ) {
    this.npAPI = networkProtocolAPI;
    clearProtocolMap();
}

// Resets the entire protocol map.
function clearProtocolMap() {
    networkProtocolMap = {};
}

// Clears the network from the protocol map. Should be called if the network
// is updated with a new protocol, or is deleted.
NetworkProtocolAccess.prototype.clearProtocol = function( network ) {
    var id = network.id;
    if ( networkProtocolMap[ id ] ) {
        delete networkProtocolMap[ id ];
    }
}

NetworkProtocolAccess.prototype.getProtocol = function( network ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        var id = network.id;
        if ( ! networkProtocolMap[ id ] ) {
            try {
                // We'll need the protocol for the network.
                var np = await me.npAPI.retrieveNetworkProtocol( network.networkProtocolId );
                networkProtocolMap[ id ] = {};
                networkProtocolMap[ id ][ 'sessionData' ] = {};
                networkProtocolMap[ id ][ 'api' ] = new require( './' + np.protocolHandler );
                resolve( networkProtocolMap[ id ] );
            }
            catch ( err ) {
                console.log( "Failed to load network protocol code " + np.protocolHandler );
                reject( err );
            }
        }
        else {
            resolve( networkProtocolMap[ id ] );
        }
    });
};


//******************************************************************************
// Connect/Disconnect remote session.
//******************************************************************************

// Connect with the remote system.
//
// network     - The networks record for the network that uses this
//               protocol.
// loginData   - The data needed to log in to the remote network.  This may be
//               a username/password or some access key.  This is obtained
//               using either getCompanyAccessAccount() or getCompanyAccount()
//               for the operation in question.
//
// Returns a Promise that connects to the remote system.  We treat all
// connections like a login session, and it is up to the code in this module
// to implement that concept.  The promise returns the opaque session data to
// be passed into other methods.
NetworkProtocolAccess.prototype.connect = function( network, loginData ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // There may be connection data in the cache, but this call will
        // supercede it.
        try {
            var proto = await me.getProtocol( network );
            var connection = await proto.api.connect( network, loginData )
            if ( !proto.sessionData[ loginData.username ] ) {
                proto.sessionData[ loginData.username ] = {};
            }
            proto.sessionData[ loginData.username ].connection = connection;
            resolve( connection );
        }
        catch( err ) {
            appLogger.log( "Connect failure with" + network.name + ": " + err );
            reject( err );
        }
    });
};

// Disconnect with the remote system.
//
// network   - the network to disconnect from
// loginData - the account to disconnect.
//
// Immediately drops the connection data for the login on the network.
NetworkProtocolAccess.prototype.disconnect = function( network, loginData ) {
    var id = network.id;
    if ( networkProtocolMap[ id ] ) {
        if ( networkProtocolMap[ id ].sessionData[ loginData.username ] ) {
            networkProtocolMap[ id ].api.disconnect( networkProtocolMap[ id ].sessionData[ loginData.username ] ).then( function(){} ).catch( function(){});
            delete networkProtocolMap[ id ].sessionData[ loginData.username ];
        }
    }
};

// For methods that require sessions, make sure we have a current one for the
// network/login.  If not log in.  Then try running protocolFunc with the
// protocol and the session data.  If the first attempt fails with 401
// (unauthorized), try logging in again, assuming the previous login expired,
// and try the func one more time.
NetworkProtocolAccess.prototype.sessionWrapper = function( network, loginData, protocolFunc ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            // Get the protocol, use the session to make the call to the
            // network's protocol code.
            var proto = await me.getProtocol( network );
            if ( !proto.sessionData[ loginData.username ] ) {
                // Wait, we don't have a session.  Just log in.
                appLogger.log( "No session for login, connecting..." );
                await me.connect( network, loginData );
            }
            // Use the session we have (now?) and run the operation.
            var id = await protocolFunc( proto, proto.sessionData[ loginData.username ] );

            // Worked, great, done.
            resolve( id );
        }
        catch( err ) {
            // Failed, but why?
            if ( 401 == err ) {
                try {
                    appLogger.log( "Session expired(?), reconnecting..." );
                    await me.connect( network, loginData );
                    appLogger.log( "Reconnected session..." );
                    // Use the NEW session and run the operation.
                    var id = await protocolFunc( proto, proto.sessionData[ loginData.username ] );
                }
                catch( err ) {
                    // Error again, just report
                    appLogger.log( "Access failure with " + network.name + ": " + err );
                    reject( err );
                }
            }
            else {
                // Error, but not session expired. Just report.
                reject( err );
            }
        }
    }); // End of Promise
};


//******************************************************************************
// Add/Push/Delete companies.
//******************************************************************************

// Add company.
//
// dataAPI   - Access to the data we may need to execute this operation.
// network   - The network data.
// companyId - The company Id for the company data to be propogated,.
//
// Returns a Promise that ostensibly connects to the remote system and creates
// the company.  This may or may not do as promised (haha), and the
// implementation is completely up to the developer of the protocol.  Options
// include creating the company and an admin account for that company which
// can be used in lower-level (application, device) methods, or simply ignoring
// this call and using a global admin account to add applications and devices.
NetworkProtocolAccess.prototype.addCompany = function( dataAPI, network, companyId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        var loginData = await netProto.api.getCompanyAccessAccount( dataAPI, network );

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.addCompany( sessionData,
                                         network,
                                         companyId,
                                         dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

// Push company.  If the company exists on the remote system, update it to match
// the local data.  Otherwise, create it.
//
// dataAPI   - Access to the data we may need to execute this operation.
// network   - The network data.
// companyId - The company Id for the company data to be propogated,.
//
// Returns a Promise that ostensibly connects to the remote system and updates
// or creates the remote company.  This may or may not do as promised (haha) -
// the implementation is completely up to the developers of the protocols.
NetworkProtocolAccess.prototype.pushCompany = function( dataAPI, network, companyId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        var loginData = await netProto.api.getCompanyAccessAccount( dataAPI, network );

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.pushCompany( sessionData,
                                          network,
                                          companyId,
                                          dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};


// Delete the company.
//
// dataAPI       - Access to the data we may need to execute this operation.
// network       - The network data.
// companyId     - The company Id for the company data to be deleted.
//
// Returns a Promise that gets the application record from the remote system.
NetworkProtocolAccess.prototype.deleteCompany = function( dataAPI, network, companyId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        var loginData = await netProto.api.getCompanyAccessAccount( dataAPI, network );

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.deleteCompany( sessionData,
                                            network,
                                            companyId,
                                            dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

//******************************************************************************
// Add/Push/Delete applications.
//******************************************************************************

// Add application.
//
// dataAPI       - Access to the data we may need to execute this operation.
// network       - The network data.
// applicationId - The application Id for the application data to be propogated.
//
// Returns a Promise that connects to the remote system and creates the
// application.
NetworkProtocolAccess.prototype.addApplication = function( dataAPI, network, applicationId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            // Get the protocol for the network.
            var netProto = await me.getProtocol( network );

            // Get the credentials for accessing the application.
            var loginData = await netProto.api.getApplicationAccessAccount( dataAPI, network, applicationId );
        }
        catch ( err ) {
            reject( err );
            return;
        }

        // Use a session wrapper to call the function. (Session wrapper manages
        // logging in if session was not already set up or is expired)
         me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.addApplication( sessionData,
                                             network,
                                             applicationId,
                                             dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

// Push application.  If the application exists on the remote system, update it
// to match the local data.  Otherwise, create it.
//
// dataAPI       - Access to the data we may need to execute this operation.
// network       - The network data.
// applicationId - The application Id for the application data to be propogated,.
//
// Returns a Promise that ostensibly connects to the remote system and updates
// or creates the remote company.  This may or may not do as promised (haha) -
// the implementation is completely up to the developers of the protocols.
NetworkProtocolAccess.prototype.pushApplication = function( dataAPI, network, applicationId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        var loginData = await netProto.api.getApplicationAccessAccount( dataAPI, network, applicationId );

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.pushApplication( sessionData,
                                              network,
                                              applicationId,
                                              dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

// Delete the application.
//
// dataAPI       - Access to the data we may need to execute this operation.
// network       - The network data.
// applicationId - The application Id for the application data to be deleted,.
//
// Returns a Promise that deletes the application record from the remote system.
NetworkProtocolAccess.prototype.deleteApplication = function( dataAPI, network, applicationId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        var loginData = await netProto.api.getApplicationAccessAccount( dataAPI, network, applicationId );

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, session ) {
            return proto.api.deleteApplication( session,
                                                network,
                                                applicationId,
                                                dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};


//******************************************************************************
// Start/Stop Application data delivery.
//******************************************************************************
// Start the application.
//
// expressApp      - The express application to send data to.
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
// network to the application target.
NetworkProtocolAccess.prototype.startApplication = function( dataAPI, network, applicationId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            // Get the protocol for the network.
            var netProto = await me.getProtocol( network );

            var loginData = await netProto.api.getApplicationAccessAccount( dataAPI, network, applicationId );
        }
        catch( err ) {
            dataAPI.addLog( "Could not get start app supporting data:" + err );
            reject( err );
            return;
        }

        me.sessionWrapper( network, loginData, function( proto, session ) {
            return proto.api.startApplication( session,
                                               network,
                                               applicationId,
                                               dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
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
NetworkProtocolAccess.prototype.stopApplication = function( dataAPI, network, applicationId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            // Get the protocol for the network.
            var netProto = await me.getProtocol( network );

            var loginData = await netProto.api.getApplicationAccessAccount( dataAPI, network, applicationId );
        }
        catch( err ) {
            dataAPI.addLog( "Could not get stop app supporting data:" + err );
            reject( err );
            return;
        }

        if ( !loginData ) {
            reject( 404 );
        }

        me.sessionWrapper( network, loginData, function( proto, session ) {
            return proto.api.stopApplication( session,
                                              network,
                                              applicationId,
                                              dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

//******************************************************************************
// Add/Push/Delete devices.
//******************************************************************************

// Add device.
//
// dataAPI  - Access to the data we may need to execute this operation.
// network  - The network data.
// deviceId - The device Id for the device data to be propogated.
//
// Returns a Promise that connects to the remote system and creates the
// device.
NetworkProtocolAccess.prototype.addDevice = function( dataAPI, network, deviceId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        var loginData;
        try {
            // Get the protocol for the network.
            var netProto = await me.getProtocol( network );

            // Get the credentials for accessing the device.
            loginData = await netProto.api.getDeviceAccessAccount( dataAPI, network, deviceId );
        }
        catch ( err ) {
            dataAPI.addLog( "Failed to get suuport data for addDevice: " + err );
            reject( err );
            return;
        }


        // Use a session wrapper to call the function. (Session wrapper manages
        // logging in if session was not already set up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.addDevice( sessionData,
                                        network,
                                        deviceId,
                                        dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

// Push device.  If the device exists on the remote system, update it
// to match the local data.  Otherwise, create it.
//
// dataAPI  - Access to the data we may need to execute this operation.
// network  - The network data.
// deviceId - The device Id for the device data to be propogated,.
//
// Returns a Promise that ostensibly connects to the remote system and updates
// or creates the remote company.  This may or may not do as promised (haha) -
// the implementation is completely up to the developers of the protocols.
NetworkProtocolAccess.prototype.pushDevice = function( dataAPI, network, deviceId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        var loginData;
        try {
            // Get the protocol for the network.
            var netProto = await me.getProtocol( network );

            loginData = await netProto.api.getDeviceAccessAccount( dataAPI, network, deviceId );
            if ( !loginData ) {
                dataAPI.addLog( "Failed to get support login for pushDevice");
                reject( 404 );
                return;
            }
        }
        catch ( err ) {
            dataAPI.addLog( "Failed to get support data for pushDevice: " + err );
            reject( err );
            return;
        }

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.pushDevice( sessionData,
                                         network,
                                         deviceId,
                                         dataAPI );
        })
        .then( function( ret ) {
            resolve( ret ); } )
        .catch( function( err ) {
            appLogger.log( err );
            reject( err ); } );
    });
};

// Delete the device.
//
// dataAPI  - Access to the data we may need to execute this operation.
// network  - The network data.
// deviceId - The device Id for the device data to be deleted,.
//
// Returns a Promise that deletes the device record from the remote system.
NetworkProtocolAccess.prototype.deleteDevice = function( dataAPI, network, deviceId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        var loginData;
        try {
            // Get the protocol for the network.
            var netProto = await me.getProtocol( network );

            loginData = await netProto.api.getDeviceAccessAccount( dataAPI, network, deviceId );
        }
        catch ( err ) {
            dataAPI.addLog( "Failed to get suuport data for deleteDevice: " + err );
            reject( err );
            return;
        }

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, session ) {
            return proto.api.deleteDevice( session,
                                           network,
                                           deviceId,
                                           dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};


//******************************************************************************
// Add/Push/Delete deviceProfiles.
//******************************************************************************

// Add deviceProfile.
//
// dataAPI         - Access to the data we may need to execute this operation.
// network         - The network data.
// deviceProfileId - The deviceProfile Id for the deviceProfile data to be propogated.
//
// Returns a Promise that connects to the remote system and creates the
// deviceProfile.
NetworkProtocolAccess.prototype.addDeviceProfile = function( dataAPI, network, deviceProfileId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        // Get the credentials for accessing the deviceProfile.
        var loginData = await netProto.api.getDeviceProfileAccessAccount( dataAPI, network, deviceProfileId );
        // Use a session wrapper to call the function. (Session wrapper manages
        // logging in if session was not already set up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            proto.api.addDeviceProfile( sessionData,
                                        network,
                                        deviceProfileId,
                                        dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

// Push deviceProfile.  If the deviceProfile exists on the remote system, update it
// to match the local data.  Otherwise, create it.
//
// dataAPI         - Access to the data we may need to execute this operation.
// network         - The network data.
// deviceProfileId - The deviceProfile Id for the deviceProfile data to be propogated,.
//
// Returns a Promise that ostensibly connects to the remote system and updates
// or creates the remote company.  This may or may not do as promised (haha) -
// the implementation is completely up to the developers of the protocols.
NetworkProtocolAccess.prototype.pushDeviceProfile = function( dataAPI, network, deviceProfileId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        var loginData = await netProto.api.getDeviceProfileAccessAccount( dataAPI, network, deviceProfileId );

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, sessionData ) {
            return proto.api.pushDeviceProfile( sessionData,
                                                network,
                                                deviceProfileId,
                                                dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};

// Delete the deviceProfile.
//
// dataAPI         - Access to the data we may need to execute this operation.
// network         - The network data.
// deviceProfileId - The deviceProfile Id for the deviceProfile data to be deleted,.
//
// Returns a Promise that deletes the deviceProfile record from the remote system.
NetworkProtocolAccess.prototype.deleteDeviceProfile = function( dataAPI, network, deviceProfileId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        // Get the protocol for the network.
        var netProto = await me.getProtocol( network );

        var loginData = await netProto.api.getDeviceProfileAccessAccount( dataAPI, network, deviceProfileId );

        // Use a session wrapper to call the function. (Session
        // wrapper manages logging in if session was not already set
        // up or is expired)
        me.sessionWrapper( network, loginData, function( proto, session ) {
            return proto.api.deleteDeviceProfile( session,
                                                  network,
                                                  deviceProfileId,
                                                  dataAPI );
        })
        .then( function( ret ) { resolve( ret ); } )
        .catch( function( err ) { reject( err ); } );
    });
};



module.exports = NetworkProtocolAccess;
