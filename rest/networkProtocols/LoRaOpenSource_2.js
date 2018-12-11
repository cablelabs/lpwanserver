var request = require('request')
var nconf = require('nconf')

// General libraries in use in this module.
var appLogger = require('../lib/appLogger.js')

/**
 * The LoRa Server Protocol Handler Module
 * @module networkProtocols/LoraOpenSource
 * @see module:networkProtocols/networkProtocols
 * @type {{activeApplicationNetworkProtocols: {}}}
 */
module.exports = {}

module.exports.activeApplicationNetworkProtocols = {}
module.exports.metaData =
  {
    protocolHandlerName: 'LoRa Server 2.0',
    version:
      {
        versionText: 'Version 2.0',
        versionValue: '2.0'
      },
    networkType: 'Lora',
    oauthUrl: '',
    protocolHandlerNetworkFields: [
      {
        name: 'username',
        description: 'The username of the LoraOS admin account',
        help: '',
        type: 'string',
        label: 'Username',
        value: '',
        required: true,
        placeholder: 'myLoraUsername',
        oauthQueryParameter: ''
      },
      {
        name: 'password',
        description: 'The password of the LoraOS admin account',
        help: '',
        type: 'password',
        label: 'Password',
        value: '',
        required: true,
        placeholder: 'myLoraPassword',
        oauthQueryParameter: ''
      }
    ]
  }

module.exports.register = async function (networkProtocols) {
  appLogger.log('LoraOpenSource:register', 'warn')
  return new Promise(async function (resolve, reject) {
    let me = {
      name: 'LoRa Server',
      networkTypeId: 1,
      protocolHandler: 'LoRaOpenSource_2.js',
      networkProtocolVersion: '2.0'
    }
    setTimeout(function () {
      networkProtocols.retrieveNetworkProtocols({search: me.name, networkProtocolVersion: '1.0'})
        .then(master => {
          console.log('Found Master')
          me.masterProtocol = master.records[0].id
          networkProtocols.upsertNetworkProtocol(me)
            .then(() => {
              resolve()
            })
            .catch(err => {
              reject(err)
            })
        })
        .catch(err => {
          // No master
          networkProtocols.upsertNetworkProtocol(me)
            .then(() => {
              resolve()
            })
            .catch(err => {
              reject(err)
            })
        })
    }, 1000)
  })
}

/**
 * Test the network to verify it functions correctly.
 *
 * @param network - network to test
 * @param loginData - credentials
 * @returns {Promise<any>}
 */
module.exports.test = function (network, loginData) {
  return new Promise(function (resolve, reject) {
    appLogger.log(network.securityData)
    if (network.securityData.authorized) {
      let options = {}
      options.method = 'GET'
      options.url = network.baseUrl + '/applications' + '?limit=1&offset=0'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + network.securityData.access_token
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      options.json = true
      request(options, function (error, response, body) {
        if (!error) {
          if (response.statusCode === 401) {
            reject(new Error('Unauthorized'))
          }
          else if (response.statusCode === 404) {
            reject(new Error('URL is Incorrect'))
          }
          else if (response.statusCode >= 400) {
            appLogger.log(body)
            reject(new Error('Server Error'))
          }
          else {
            resolve(body)
          }
        }
        else {
          appLogger.log('Test Error: ', 'error')
          if (response && response.statusCode) {
            appLogger.log(response.statusCode)
          }
          appLogger.log(error, 'error')
          reject(error)
        }
      })
    }
    else {
      reject(new Error('Not Authorized'))
    }
  })
}

//* *****************************************************************************
// Maps the standard remote network API to the LoRaOpenSource server.
// This is a cross-platform API that must remain consistent.
//* *****************************************************************************

// The login account data needed to manipulate companies.
//
// dataAPI - The API that handles common data access and manipulation functions
//           on behalf of the protocol.
// network - The network that we are to get the company account info for.  For
//           LoRa Server, this is a global admin account.
module.exports.getCompanyAccessAccount = async function (dataAPI, network) {
  let secData = network.securityData
  if (!secData || !secData.username || !secData.password) {
    appLogger.log('Network security data is incomplete for ' + network.name)
    appLogger.log('Network security data is incomplete for ' + network.name)
    return null
  }
  return {
    username: secData.username,
    password: secData.password,
    admin: true
  }
}

// The login account data needed to manipulate applications.  For LoRa Open
// Source, this is the company admin account.
//
// dataAPI       - The API that handles common data access and manipulation
//                 functions on behalf of the protocol.
// network - The network that we are to get the application account info for.
//           For LoRa Server, this is a company account.
// applicationId - The id of the local application record, used to get to the
//                 company.
module.exports.getApplicationAccessAccount = async function (dataAPI, network, applicationId) {
  // Get the company for this application.
  var co = await dataAPI.getCompanyByApplicationId(applicationId)

  // Return the account info.  Don't generate a new account - it must already
  // be there.
  return getCompanyAccount(dataAPI, network, co.id, false)
}

// The login account data needed to manipulate devices.  For LoRa Open
// Source, this is th  appLogger.log(secData)
//
// dataAPI  - The API that handles common data access and manipulation
//            functions on behalf of the protocol.
// network  - The network that we are to get the application account info for.
//            For LoRa Server, this is a company account.
// deviceId - The id of the local device record, used to get to the
//            company.
module.exports.getDeviceAccessAccount = async function (dataAPI, network, deviceId) {
  // Get the company for this device.
  var co = await dataAPI.getCompanyByDeviceId(deviceId)

  // Return the account info.  Don't generate a new account - it must already
  // be there.
  return getCompanyAccount(dataAPI, network, co.id, false)
}

// The login account data needed to manipulate deviceProfiles.  For LoRa Open
// Source, this is the company admin account.
//
// dataAPI         - The API that handles common data access and manipulation
//                   functions on behalf of the protocol.
// network         - The network that we are to get the application account info
//                   for. For LoRa Server, this is a company account.
// deviceProfileId - The id of the local device record, used to get to the
//                   company.
module.exports.getDeviceProfileAccessAccount = async function (dataAPI, network, deviceId) {
  // Get the company for this device.
  var co = await dataAPI.getCompanyByDeviceProfileId(deviceId)

  // Return the account info.  Don't generate a new account - it must already
  // be there.
  return getCompanyAccount(dataAPI, network, co.id, false)
}

// The company admin account data for the company on the network, used to set up
// applications and devices.  If the account data does not exist, this code
// can optionally generate it.
async function getCompanyAccount (dataAPI, network, companyId, generateIfMissing) {
  // Obtain the security data from the protocol storage in the dataAPI, then
  // access it for the user.
  var srd
  var kd
  var secData
  try {
    srd = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeCompanyDataKey(companyId, 'sd'))

    kd = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeCompanyDataKey(companyId, 'kd'))
  }
  catch (err) {
    // Something's off.  Generate new if allowed.
    if (generateIfMissing) {
      appLogger.log('Generating account for ' + companyId)
      // Take the company name, make it suitable for a user name, and then
      // add "admin" for the username.
      var corec = await dataAPI.getCompanyById(companyId)
      var uname = corec.name.replace(/[^a-zA-Z0-9]/g, '')
      uname += 'admin'
      var pass = await dataAPI.genPass()
      kd = await dataAPI.genKey()
      secData = {'username': uname, 'password': pass}
      srd = dataAPI.hide(network, secData, kd)
      appLogger.log(uname)
      appLogger.log(pass)

      // Save for future reference.networkId, networkProtocolId, key, data
      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(companyId, 'sd'),
        srd)

      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(companyId, 'kd'),
        kd)
      return secData
    }
    else {
      appLogger.log(JSON.stringify(err))
      appLogger.log(
        'LoraOS: Company security data is missing for company id ' +
        companyId)
      return null
    }
  }

  try {
    secData = await dataAPI.access(network, srd, kd)
  }
  catch (err) {
    return null
  }

  if (!secData.username || !secData.password) {
    appLogger.log(
      'Company security data is incomplete for company id ' +
      companyId)
    return null
  }

  return secData
};

function makeNetworkDataKey (networkId, dataName) {
  return 'nwk:' + networkId + '/' + dataName
}

function makeCompanyDataKey (companyId, dataName) {
  return 'co:' + companyId + '/' + dataName
}

function makeApplicationDataKey (applicationId, dataName) {
  return 'app:' + applicationId + '/' + dataName
}

function makeDeviceDataKey (deviceId, dataName) {
  return 'dev:' + deviceId + '/' + dataName
}

function makeDeviceProfileDataKey (deviceProfileId, dataName) {
  return 'dp:' + deviceProfileId + '/' + dataName
}

// Creating a ServiceProfile requires a NetworkServerId.  However, that's pretty
// esoteric concept for general application management, so we provide this
// method that will get a network server id from the LoRa system.
function getANetworkServerID (network, connection) {
  appLogger.log('LoRaOpenSource: getANetworkServerID')
  return new Promise(async function (resolve, reject) {
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    // options.url = network.baseUrl + "/network-servers?limit=1&offset=0";
    options.url = network.baseUrl + '/network-servers?limit=20&offset=0'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Network Server: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log('Error on get Network Server: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        // Convert text to JSON array, use id from first element
        var res = JSON.parse(body)
        var nsList = res.result
        if (nsList.length == 0) {
          appLogger.log('Empty list of Network Servers returned')
          reject(404)
          return
        }
        appLogger.log(nsList)
        resolve(nsList[0].id)
      }
    })
  })
}

// Get the NetworkServer using the Service Profile a ServiceProfile.
function getNetworkServerById (network, networkServerId, connection, dataAPI) {
  appLogger.log('LoRaOpenSource: getNetworkServerForRemoteOrganization')
  return new Promise(async function (resolve, reject) {
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/network-servers/' + networkServerId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Network Server: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log('Error on get Network Server: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        let res = ''
        if (typeof body === 'object') {
          res = body
        }
        else {
          res = JSON.parse(body)
        }
        appLogger.log(res, 'warn')
        resolve(res)
      }
    })
  })
};

function getDeviceProfileById (network, dpId, connection, dataAPI) {
  appLogger.log('LoRaOpenSource: getDeviceProfileById')
  return new Promise(async function (resolve, reject) {
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/device-profiles/' + dpId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    appLogger.log(options, 'warn')
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Device Profile: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log(bodyObj)
          appLogger.log(options, 'warn')
          appLogger.log('Error on get Device Profile: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        var res = JSON.parse(body)
        appLogger.log(res)
        resolve(res)
      }
    })
  })
};

function getRemoteDeviceById (network, deviceId, connection) {
  appLogger.log('LoRaOpenSource: getDeviceProfileById')
  return new Promise(async function (resolve, reject) {
    // Set up the request options.
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/devices/' + deviceId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    appLogger.log(options, 'warn')
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Device: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log('Error on get Device: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        var device = JSON.parse(body)
        appLogger.log(device, 'info')
        resolve(device)
      }
    })
  })
};

function getRemoteDeviceKey (network, device, connection) {
  appLogger.log('LoRaOpenSource: getRemoteDeviceKey', 'info')
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/devices/' + device.device.devEUI + '/keys'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    appLogger.log(options, 'warn')
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Device Keys: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else if (response.statusCode === 404) {
          appLogger.log('Device does not have a key', 'info')
          resolve(device)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log('Error on get Device Keys: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        let keys = JSON.parse(body)
        device.device.deviceKeys = keys.deviceKeys
        resolve(device)
      }
    })
  })
};

function getRemoteDeviceActivation (network, device, connection) {
  appLogger.log('LoRaOpenSource: getRemoteDeviceActivation', 'info')
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/devices/' + device.device.devEUI + '/activation'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    appLogger.log(options, 'warn')
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Device Keys: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else if (response.statusCode === 404) {
          appLogger.log('Device does not have a key', 'info')
          resolve(device)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log('Error on get Device Keys: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        let keys = JSON.parse(body)
        device.device.deviceActivation = keys.deviceActivation
        resolve(device)
      }
    })
  })
};

// Get the NetworkServer using the Service Profile a ServiceProfile.
function getServiceProfileById (network, serviceProfileId, connection, dataAPI) {
  appLogger.log('LoRaOpenSource: getServiceProfileById')
  return new Promise(async function (resolve, reject) {
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/service-profiles/' + serviceProfileId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Service Profile: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log('Error on get Service Profile: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        var res = JSON.parse(body)
        appLogger.log(res)
        resolve(res)
      }
    })
  })
}

// Get the NetworkServer using the Service Profile a ServiceProfile.
function getApplicationById (network, applicationId, connection) {
  appLogger.log('LoRaOpenSource: getApplicationById')
  return new Promise(async function (resolve, reject) {
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/applications/' + applicationId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options, 'warn')
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Application: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          var bodyObj = JSON.parse(response.body)
          appLogger.log('Error on get Application: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        // Convert text to JSON array, use id from first element
        var res = JSON.parse(body)
        appLogger.log(res)
        resolve(res)
      }
    })
  })
}

// Get the Service Profile a for a Remote Org.
function getServiceProfileForOrg (network, orgId, companyId, connection, dataAPI) {
  appLogger.log('LoRaOpenSource: getServiceProfileForOrg', 'debug')
  return new Promise(async function (resolve, reject) {
    var spOptions = {}
    spOptions.method = 'GET'
    spOptions.url = network.baseUrl + '/service-profiles?organizationID=' + orgId + '&limit=20&offset=0'
    spOptions.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + connection
    }

    spOptions.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    appLogger.log(spOptions)
    request(spOptions, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error getting Service Profile: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error getting Service Profile: ' + response.statusCode +
            ' (Server message: ' + response.body.error + ')')
          reject(response.statusCode)
        }
      }
      else {
        // Save the ServiceProfile ID from the remote
        // network.
        body = JSON.parse(body)
        appLogger.log(body)
        if (body.totalCount == 0) {
          // no SP to get
          resolve()
        }
        else {
          let serviceProfile = body.result[0]
          appLogger.log(serviceProfile, 'warn')
          await dataAPI.putProtocolDataForKey(
            network.id,
            network.networkProtocolId,
            makeCompanyDataKey(companyId, 'coSPId'),
            serviceProfile.id)
          // TODO: Remove this HACK.  Should not store the service profile locally
          //       in case it gets changed on the remote server.
          await dataAPI.putProtocolDataForKey(
            network.id,
            network.networkProtocolId,
            makeCompanyDataKey(companyId, 'coSPNwkId'),
            serviceProfile.networkServerID)
          resolve(serviceProfile)
        }
      }
    }) // End of service profile create
  })
}

// Creating a DeviceProfile requires a NetworkServerId.  However, you can't get
// data from that table in LoRa if you aren't a Global Admin.  So get the
// company's ServiceProfile and get it from that.
function getANetworkServerIDFromServiceProfile (network, connection, coId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var coSPId
    try {
      coSPId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(coId, 'coSPId'))
    }
    catch (err) {
      appLogger.log('Error on getting Service Profile Id: ' + err)
      reject(err)
      return
    }

    // TODO: FIX THIS HACK.  Storing the network ID locally is bad, in case the
    //       service for the company is changes on the remote LoRa system.

    try {
      var coSPNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(coId, 'coSPNwkId'))
      resolve(coSPNwkId)
    }
    catch (err) {
      appLogger.log("Error on getting Service Profile's Network's Id: " + err)
      reject(err)
    }

    /* The loraserver is failing to load the serviceprofile, and passes that back
   to us as a 500 error, causing all kinds of mayhem.  The hack above bypasses
   this problem.
        // Set up the request options.
        var options = {};
        options.method = 'GET';
        options.url = network.baseUrl + "/service-profiles/" + coSPId;
        options.headers = { "Content-Type": "application/json",
                            "Authorization": "Bearer " + connection };
        options.agentOptions = {
            "secureProtocol": "TLSv1_2_method",
            "rejectUnauthorized": false };

        request( options, async function( error, response, body ) {
            var bodyObj;
            if ( typeof body === 'object' ) {
                bodyObj = body;
            }
            else {
                bodyObj = JSON.parse( response.body );
            }
            if ( error || response.statusCode >= 400 ) {
                if ( error ) {
                    dataAPI.addLog( network, "Error on get Service Profile: " + error );
                    reject( error );
                    return;
                }
                else {
                    dataAPI.addLog( network, "Error on get Service Profile: " +
                                  bodyObj.error +
                                   " (" + response.statusCode + ")" );
                    reject( response.statusCode );
                    return;
                }
            }
            else {
                // Return the networkServerId from the returned object.
                resolve( bodyObj.networkServerID );
            }
        });
        */
  })
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
module.exports.connect = function (network, loginData) {
  return new Promise(function (resolve, reject) {
    // Set up the request options.
    var options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/internal/login'
    options.headers = {'Content-Type': 'application/json'}
    options.json = loginData
    options.agentOptions = {'secureProtocol': 'TLSv1_2_method', 'rejectUnauthorized': false}
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on signin: ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else if (response.statusCode >= 400 || response.statusCode === 301) {
        appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
        reject(response.statusCode)
      }
      else {
        var token = body.jwt
        if (token) {
          resolve(token)
        }
        else {
          reject(new Error('Server Error'))
        }
      }
    })
  })
}

// Disconnect with the remote system.
//
// connection - The data top use to drop the connection
//
// Returns a Promise that disconnects from the remote system.
module.exports.disconnect = function (connection) {
  return new Promise(function (resolve, reject) {
    // LoRa app server doesn't have a logout.  Just clear the token.
    connection = null
    resolve()
  })
}

//* *****************************************************************************
// CRUD companies.
//* *****************************************************************************

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
module.exports.addCompany = function (sessionData, network, companyId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the application data.
    var company
    try {
      company = await dataAPI.getCompanyById(companyId)
    }
    catch (err) {
      appLogger.log(err, 'error')
      reject(err)
      return
    }

    // Set up the request options.
    var options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/organizations'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    // No need to allow gateways on organizations we create (may be changed
    // locally by network admin, and that's fine - just start w/o gateways).
    options.json = {
      organization: {
        'name': company.name,
        'displayName': company.name,
        'canHaveGateways': false
      }
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on create company ' + company.name + ': ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error on create company ' + company.name +
            ': ' + response.statusCode)
          appLogger.log(body)
          reject(response.statusCode)
        }
      }
      else {
        try {
          // Save the company ID from the remote network.
          appLogger.log(body)
          await dataAPI.putProtocolDataForKey(network.id,
            network.networkProtocolId,
            makeCompanyDataKey(company.id, 'coNwkId'),
            body.id)
          var networkCoId = body.id

          // We will need an admin user for this company.
          var userOptions = {}
          userOptions.method = 'POST'
          userOptions.url = network.baseUrl + '/users'
          userOptions.headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionData.connection
          }

          // Get/generate the company username/password
          var creds = await getCompanyAccount(dataAPI, network, companyId, true)

          userOptions.json = {
            'password': creds.password,
            user: {
              'username': creds.username,
              'isActive': true,
              'isAdmin': false,
              'sessionTTL': 0,
              'email': 'fake@emailaddress.com',
              'note': 'Created by and for LPWAN Server'
            },
            'organizations': [
              {
                'isAdmin': true,
                'organizationID': networkCoId
              }
            ]
          }
          userOptions.agentOptions = {
            'secureProtocol': 'TLSv1_2_method',
            'rejectUnauthorized': false
          }

          request(userOptions, async function (error, response, body) {
            if (error || response.statusCode >= 400) {
              if (error) {
                appLogger.log('Error creating ' + company.name +
                  "'s admin user " + userOptions.json.username +
                  ': ', 'error')
                appLogger.log(error, 'error')
                reject(error)
                return
              }
              else {
                appLogger.log('Error creating ' + company.name +
                  "'s admin user " + userOptions.json.username +
                  ': ' + response.statusCode +
                  ' (Server message: ' + response.body.error + ')')
                reject(response.statusCode)
                return
              }
            }
            else {
              appLogger.log(body)
              // Save the user ID from the remote network.
              await dataAPI.putProtocolDataForKey(network.id,
                network.networkProtocolId,
                makeCompanyDataKey(company.id, 'coUsrId'),
                body.id)
            }

            // Set up a default Service Profile.
            var networkServerId = await getANetworkServerID(network, sessionData.connection)

            var spOptions = {}
            spOptions.method = 'POST'
            spOptions.url = network.baseUrl + '/service-profiles'
            spOptions.headers = {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + sessionData.connection
            }

            spOptions.json = {
              'serviceProfile': {
                'name': 'defaultForLPWANServer',
                'networkServerID': networkServerId,
                'organizationID': networkCoId,
                'addGWMetadata': true,
                'devStatusReqFreq': 1,
                'dlBucketSize': 0,
                'ulRate': 100000,
                'dlRate': 100000,
                'dlRatePolicy': 'DROP',
                'ulRatePolicy': 'DROP',
                'drMax': 3,
                'drMin': 0,
                'reportDevStatusBattery': true,
                'reportDevStatusMargin': true
              }
            }
            spOptions.agentOptions = {
              'secureProtocol': 'TLSv1_2_method',
              'rejectUnauthorized': false
            }
            request(spOptions, async function (error, response, body) {
              if (error || response.statusCode >= 400) {
                if (error) {
                  appLogger.log('Error creating default Service Profile: ', 'error')
                  appLogger.log(error, 'error')
                  reject(error)
                }
                else {
                  appLogger.log('Error creating default Service Profile: ' + response.statusCode +
                    ' (Server message: ' + response.body.error + ')')
                  reject(response.statusCode)
                }
              }
              else {
                // Save the ServiceProfile ID from the remote
                // network.
                await dataAPI.putProtocolDataForKey(
                  network.id,
                  network.networkProtocolId,
                  makeCompanyDataKey(company.id, 'coSPId'),
                  body.id)
                // TODO: Remove this HACK.  Should not store the service profile locally
                //       in case it gets changed on the remote server.
                await dataAPI.putProtocolDataForKey(
                  network.id,
                  network.networkProtocolId,
                  makeCompanyDataKey(company.id, 'coSPNwkId'),
                  networkServerId)
                resolve(body)
              }
            }) // End of service profile create
          }) // End of user create request.
        }
        catch (err) {
          appLogger.log('Failed to add ancillary data to remote host: ' + err)
          reject(err)
        }
      }
    })
  })
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
module.exports.getCompany = function (sessionData, network, companyId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the remote company id.
    var coid
    var company
    try {
      company = await dataAPI.getCompanyById(companyId)
      coid = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(company.id, 'coNwkId'))
    }
    catch (err) {
      // No data.
      appLogger.log('Company ' + company.name +
        ' does not have a key for the remote network.  Company has not yet been created.')
      reject(err)
    }

    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/organizations/' + coid
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error getting company ' + company.name + ': ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        resolve(body)
      }
    })
  })
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
// Returns a Promise that gets the company record from the remote system.
module.exports.updateCompany = function (sessionData, network, companyId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the remote company id.
    var coid
    var company
    try {
      company = await dataAPI.getCompanyById(companyId)
      coid = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(company.id, 'coNwkId'))
    }
    catch (err) {
      // No data.
      appLogger.log('Company ' + company.name +
        ' does not have a key for the remote network.  Company has not yet been created.')
      reject(err)
    }

    // Set up the request options.
    var options = {}
    options.method = 'PUT'
    options.url = network.baseUrl + '/organizations/' + coid
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.json = {
      'name': company.name,
      'displayName': company.name,
      'organizationID': coid
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error updating company ' + company.name +
          ': ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        resolve()
      }
    })
  })
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
module.exports.deleteCompany = function (sessionData, network, companyId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the remote company id.
    var coid
    var userId
    try {
      coid = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(companyId, 'coNwkId'))

      // Get the admin user's id, too.
      userId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(companyId, 'coUsrId'))
    }
    catch (err) {
      // No data.
      appLogger.log('Company ' + companyId +
        ' does not have a key for the remote network.  Company has not yet been created.')
      reject(err)
      return
    }

    // Set up the request options to delete the user first.
    var userOptions = {}
    userOptions.method = 'DELETE'
    userOptions.url = network.baseUrl + '/users/' + userId
    userOptions.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    userOptions.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    request(userOptions, function (error, response, body) {
      if (error) {
        appLogger.log("Error on delete company's admin user: ", 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        // Set up the request options to delete the company.
        var options = {}
        options.method = 'DELETE'
        options.url = network.baseUrl + '/organizations/' + coid
        options.headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sessionData.connection
        }
        options.agentOptions = {
          'secureProtocol': 'TLSv1_2_method',
          'rejectUnauthorized': false
        }

        request(options, async function (error, response, body) {
          if (error) {
            appLogger.log('Error on delete company: ', 'error')
            appLogger.log(error, 'error')
            reject(error)
          }
          else {
            // Clear the data for this company from the
            // protocolData store.
            await dataAPI.deleteProtocolDataForKey(
              network.id,
              network.networkProtocolId,
              makeCompanyDataKey(companyId, 'kd'))
            await dataAPI.deleteProtocolDataForKey(
              network.id,
              network.networkProtocolId,
              makeCompanyDataKey(companyId, 'coUsrId'))

            await dataAPI.deleteProtocolDataForKey(
              network.id,
              network.networkProtocolId,
              makeCompanyDataKey(companyId, 'coNwkId'))
            await dataAPI.deleteProtocolDataForKey(
              network.id,
              network.networkProtocolId,
              makeCompanyDataKey(companyId, 'sd'))
            await dataAPI.deleteProtocolDataForKey(
              network.id,
              network.networkProtocolId,
              makeCompanyDataKey(companyId, 'coSPId'))
            // TODO: Remove this HACK.  Should not store the
            // service profile locally in case it gets changed on
            // the remote server.
            await dataAPI.deleteProtocolDataForKey(
              network.id,
              network.networkProtocolId,
              makeCompanyDataKey(companyId, 'coSPNwkId'))
            resolve()
          }
        })
      }
    })
  })
}

/**
 * Push all information out to the network server
 *
 * @param sessionData
 * @param network
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<any>}
 */
module.exports.pushNetwork = function (sessionData, network, dataAPI, modelAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let promiseList = []
    promiseList.push(me.pushDeviceProfiles(sessionData, network, modelAPI, dataAPI))
    promiseList.push(me.pushApplications(sessionData, network, modelAPI, dataAPI))
    Promise.all(promiseList)
      .then(pushedResources => {
        let devicePromiseList = []
        devicePromiseList.push(me.pushDevices(sessionData, network, modelAPI, dataAPI))
        Promise.all(devicePromiseList)
          .then(pushedResource => {
            appLogger.log(pushedResource, 'info')
            resolve()
          })
          .catch(err => {
            appLogger.log(err, 'error')
            reject(err)
          })
      })
      .catch(err => {
        appLogger.log(err)
        reject(err)
      })
  })
}

module.exports.pushApplications = function (sessionData, network, modelAPI, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let existingApplications = await modelAPI.applications.retrieveApplications()
    let promiseList = []
    for (let index = 0; index < existingApplications.records.length; index++) {
      promiseList.push(me.pushApplication(sessionData, network, existingApplications.records[index], dataAPI, false))
    }
    Promise.all(promiseList)
      .then(pushedResources => {
        appLogger.log(pushedResources)
        resolve()
      })
      .catch(err => {
        appLogger.log(err)
        reject(err)
      })
  })
}

module.exports.pushApplication = function (sessionData, network, application, dataAPI, update = true) {
  let me = this
  return new Promise(async function (resolve, reject) {
    // See if it already exists
    dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(application.id, 'appNwkId'))
      .then(appNetworkId => {
        if (update && appNetworkId) {
          me.updateApplication(sessionData, network, application.id, dataAPI)
            .then(() => {
              resolve()
            })
            .catch(err => {
              appLogger.log(err, 'error')
              reject(err)
            })
        }
        else if (appNetworkId) {
          appLogger.log('Ignoring Application  ' + application.id + ' already on network ' + network.name)
          resolve({localApplication: application.id, remoteApplication: appNetworkId})
        }
        else {
          reject(new Error('Bad things in the Protocol Table'))
        }
      })
      .catch(() => {
        me.addApplication(sessionData, network, application.id, dataAPI)
          .then((appNetworkId) => {
            appLogger.log('Added application ' + application.id + ' to network ' + network.name)
            resolve({localApplication: application.id, remoteApplication: appNetworkId})
          })
          .catch(err => {
            appLogger.log(err)
            reject(err)
          })
      })
  })
}

module.exports.pushDeviceProfiles = function (sessionData, network, modelAPI, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let existingDeviceProfiles = await modelAPI.deviceProfiles.retrieveDeviceProfiles()
    let promiseList = []
    for (let index = 0; index < existingDeviceProfiles.records.length; index++) {
      promiseList.push(me.pushDeviceProfile(sessionData, network, existingDeviceProfiles.records[index], dataAPI))
    }
    Promise.all(promiseList)
      .then(pushedResources => {
        appLogger.log(pushedResources)
        resolve()
      })
      .catch(err => {
        appLogger.log(err)
        reject(err)
      })
  })
}

module.exports.pushDeviceProfile = function (sessionData, network, deviceProfile, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    // See if it already exists
    appLogger.log(deviceProfile, 'info')
    dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceProfileDataKey(deviceProfile.id, 'dpNwkId'))
      .then(dpNetworkId => {
        appLogger.log(dpNetworkId, 'info')
        if (dpNetworkId) {
          appLogger.log('Ignoring Device Profile  ' + deviceProfile.id + ' already on network ' + network.name)
          resolve({
            localDeviceProfile: deviceProfile.id,
            remoteDeviceProfile: dpNetworkId
          })
        }
        else {
          appLogger.log(dpNetworkId + '')

          reject(new Error('Something bad happened with the Protocol Table'))
        }
      })
      .catch(() => {
        me.addDeviceProfile(sessionData, network, deviceProfile.id, dataAPI)
          .then((remoteId) => {
            appLogger.log('Added Device Profile ' + deviceProfile.id + ' to network ' + network.name)
            resolve({
              localDeviceProfile: deviceProfile.id,
              remoteDeviceProfile: remoteId
            })
          })
          .catch(err => {
            appLogger.log(err)
            reject(err)
          })
      })
  })
}

module.exports.pushDevices = function (sessionData, network, modelAPI, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let existingDevices = await modelAPI.devices.retrieveDevices()
    let promiseList = []
    for (let index = 0; index < existingDevices.records.length; index++) {
      promiseList.push(me.pushDevice(sessionData, network, existingDevices.records[index], dataAPI))
    }
    Promise.all(promiseList)
      .then(pushedResources => {
        appLogger.log(pushedResources)
        resolve(pushedResources)
      })
      .catch(err => {
        appLogger.log(err)
        reject(err)
      })
  })
}

module.exports.pushDevice = function (sessionData, network, device, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    // See if it already exists
    dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceDataKey(device.id, 'devNwkId'))
      .then(devNetworkId => {
        appLogger.log('Ignoring Device  ' + device.id + ' already on network ' + network.name)
        if (devNetworkId) {
          resolve({localDevice: device.id, remoteDevice: devNetworkId})
        }
        else {
          appLogger.log(devNetworkId + ' found for network ' + network.name + ' for device ' + device.id)
          reject(new Error('Something bad happened with the Protocol Table'))
        }
      })
      .catch(() => {
        me.addDevice(sessionData, network, device.id, dataAPI)
          .then((devNetworkId) => {
            appLogger.log('Added Device  ' + device.id + ' to network ' + network.name)
            resolve({localDevice: device.id, remoteDevice: devNetworkId})
          })
          .catch(err => {
            appLogger.log(err)
            reject(err)
          })
      })
  })
}

/**
 * Pull remote resources on Lora 1.0 Server
 *
 * @param sessionData
 * @param network
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<any>}
 */
module.exports.pullNetwork = function (sessionData, network, dataAPI, modelAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    me.setupOrganization(sessionData, network, modelAPI, dataAPI)
      .then((companyNtl) => {
        let promiseList = []
        promiseList.push(me.pullDeviceProfiles(sessionData, network, modelAPI, companyNtl, dataAPI))
        promiseList.push(me.pullApplications(sessionData, network, modelAPI, dataAPI, companyNtl))

        Promise.all(promiseList)
          .then(pulledResources => {
            appLogger.log(pulledResources)
            let devicePromistList = []
            for (let index in pulledResources[1]) {
              devicePromistList.push(me.pullDevices(sessionData, network, pulledResources[1][index].remoteApplication, pulledResources[1][index].localApplication, pulledResources[0], modelAPI, dataAPI))
              devicePromistList.push(me.pullIntegrations(sessionData, network, pulledResources[1][index].remoteApplication, pulledResources[1][index].localApplication, pulledResources[0], modelAPI, dataAPI))
            }
            Promise.all(devicePromistList)
              .then((devices) => {
                appLogger.log(devices)
                resolve()
              })
              .catch(err => {
                appLogger.log(err)
                reject(err)
              })
          })
          .catch(err => {
            appLogger.log(err)
            reject(err)
          })
      })
  })
}

/**
 * Setup the operator org on the remote server
 * Get the network server based on region
 * Create a service profile for this organization
 * -or-
 * Get existing org information
 * get existing service profile
 * @returns {Promise<any>}
 */
module.exports.setupOrganization = function (sessionData, network, modelAPI, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let company = await modelAPI.companies.retrieveCompany(2)
    let companyNtl = await dataAPI.getCompanyNetworkType(company.id, network.networkTypeId)
    let lora1NetworkSettings = {network: network.id}
    if (!companyNtl) {
      companyNtl = await modelAPI.companyNetworkTypeLinks.createRemoteCompanyNetworkTypeLink(company.id, network.networkTypeId, {})
      companyNtl.networkSettings = JSON.parse(companyNtl.networkSettings)

    }
    appLogger.log(company)
    appLogger.log(companyNtl)
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/organizations?search=' + company.name + '&limit=1'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options, 'warn')
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error getting operator ' + company.name + ' from network ' + network.name + ': ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        body = JSON.parse(body)
        appLogger.log(body)
        if (body.totalCount === '0') {
          appLogger.log('Adding company to network ', 'warn')
          me.addCompany(sessionData, network, company.id, dataAPI)
            .then((networkSettings) => {
              appLogger.log(networkSettings)
              lora1NetworkSettings.serviceProfileId = networkSettings.serviceProfileID
              lora1NetworkSettings.networkServerId = networkSettings.networkServerID
              appLogger.log(companyNtl)
              resolve(companyNtl)
            })
            .catch(err => {
              appLogger.log(err)
              reject(err)
            })
        }
        else {
          let organization = body.result[0]
          appLogger.log('Setting up company to match network Organization', 'warn')
          getServiceProfileForOrg(network, organization.id, company.id, sessionData.connection, dataAPI)
            .then(networkSettings => {
              appLogger.log(networkSettings, 'warn')
              dataAPI.putProtocolDataForKey(network.id,
                network.networkProtocolId,
                makeCompanyDataKey(company.id, 'coNwkId'),
                organization.id)

              getNetworkServerById(network, networkSettings.networkServerID, sessionData.connection, dataAPI)
                .then(networkServer => {
                  appLogger.log(networkServer, 'warn')
                  lora1NetworkSettings.serviceProfileId = networkSettings.id
                  lora1NetworkSettings.networkServerId = networkSettings.networkServerID
                  lora1NetworkSettings.organizationId = organization.id
                  lora1NetworkSettings.networkId = network.id


                  companyNtl.networkSettings.serviceProfile = {region: networkServer.region}
                  companyNtl.networkSettings[network.name] = lora1NetworkSettings
                  appLogger.log(companyNtl, 'warn')

                  modelAPI.companyNetworkTypeLinks.updateRemoteCompanyNetworkTypeLink(companyNtl)
                    .then((result) => {
                      appLogger.log(result)
                      resolve(lora1NetworkSettings)
                    })
                    .catch(err => {
                      appLogger.log(err)
                      reject(err)
                    })
                })
                .catch(err => {
                  appLogger.log(err)
                  reject(err)
                })
            })
            .catch(err => {
              appLogger.log(err, 'error')
              reject(err)
            })
        }
      }
    })
  })
}

/**
 * Pull remote resources on Lora 1.0 Server
 *
 * @param sessionData
 * @param network
 * @param companyMap
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<any>}
 */
module.exports.pullDeviceProfiles = function (sessionData, network, modelAPI, companyNtl, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/device-profiles' + '?organizationID=' + companyNtl.organizationId + '&limit=9999&offset=0'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options, 'warn')
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error pulling device profiles from network ' + network.name + ': ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        body = JSON.parse(body)
        appLogger.log(body)

        let deviceProfiles = body.result
        let promiseList = []
        for (let index in deviceProfiles) {
          let dp = deviceProfiles[index]
          promiseList.push(me.addRemoteDeviceProfile(sessionData, dp, network, modelAPI, dataAPI))
        }
        Promise.all(promiseList)
          .then((devices) => {
            appLogger.log(devices, 'info')
            resolve(devices)
          })
          .catch(err => {
            appLogger.log(err)
            reject(err)
          })
      }
    })
  })
}

module.exports.addRemoteDeviceProfile = function (sessionData, limitedRemoteDeviceProfile, network, modelAPI, dataAPI) {
  return new Promise(async function (resolve, reject) {
    getDeviceProfileById(network, limitedRemoteDeviceProfile.id, sessionData.connection)
      .then((remoteDeviceProfile) => {
        appLogger.log('Adding ' + remoteDeviceProfile.deviceProfile.name)
        appLogger.log(remoteDeviceProfile)
        modelAPI.deviceProfiles.retrieveDeviceProfiles({search: remoteDeviceProfile.deviceProfile.name})
          .then(existingDeviceProfile => {
            if (existingDeviceProfile.totalCount > 0) {
              existingDeviceProfile = existingDeviceProfile.records[0]
              appLogger.log(existingDeviceProfile.name + ' already exists')

              dataAPI.putProtocolDataForKey(network.id,
                network.networkProtocolId,
                makeDeviceProfileDataKey(existingDeviceProfile.id, 'dpNwkId'),
                remoteDeviceProfile.deviceProfile.id)

              resolve({
                localDeviceProfile: existingDeviceProfile.id,
                remoteDeviceProfile: remoteDeviceProfile.deviceProfile.id
              })
            }
            else {
              appLogger.log('creating ' + remoteDeviceProfile.deviceProfile.name)
              let networkSpecificDeviceProfileInformation = normalizeDeviceProfileData(remoteDeviceProfile)
              appLogger.log(networkSpecificDeviceProfileInformation, 'error')
              modelAPI.deviceProfiles.createRemoteDeviceProfile(network.networkTypeId, 2,
                remoteDeviceProfile.deviceProfile.name, 'Device Profile managed by LPWAN Server, perform changes via LPWAN',
                networkSpecificDeviceProfileInformation)
                .then((existingDeviceProfile) => {
                  appLogger.log(existingDeviceProfile)

                  dataAPI.putProtocolDataForKey(network.id,
                    network.networkProtocolId,
                    makeDeviceProfileDataKey(existingDeviceProfile.id, 'dpNwkId'),
                    remoteDeviceProfile.deviceProfile.id)

                  resolve({
                    localDeviceProfile: existingDeviceProfile.id,
                    remoteDeviceProfile: remoteDeviceProfile.deviceProfile.id
                  })
                })
                .catch((error) => {
                  appLogger.log(error)
                  appLogger.log(error, 'error')
                  reject(error)
                })
            }
          })
          .catch((error) => {
            appLogger.log(error)
            appLogger.log(error, 'error')
            reject(error)
          })
      })
      .catch((error) => {
        appLogger.log(error)
        appLogger.log(error, 'error')
        reject(error)
      })
  })
}

/**
 * Pull remote applications on Lora 1.0 Server
 * @param sessionData
 * @param network
 * @param companyMap
 * @param dpMap
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<any>}
 */
module.exports.pullApplications = function (sessionData, network, modelAPI, dataAPI, companyNtl) {
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.url = network.baseUrl + '/applications' + '?organizationID=' + companyNtl.organizationId + '&limit=9999&offset=0'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options, 'warn')
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error pulling applications from network ' + network.name + ': ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        body = JSON.parse(body)
        let apps = body.result
        appLogger.log(apps)
        let promiseList = []
        for (let index in apps) {
          let app = apps[index]
          promiseList.push(addRemoteApplication(sessionData, app, network, modelAPI, dataAPI))
        }
        Promise.all(promiseList)
          .then((apps) => {
            resolve(apps)
          })
          .catch(err => {
            appLogger.log(err)
            reject(err)
          })
      }
    })
  })
}

function addRemoteApplication (sessionData, limitedRemoteApplication, network, modelAPI, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let remoteApplication = await getApplicationById(network, limitedRemoteApplication.id, sessionData.connection)
    appLogger.log(remoteApplication, 'error')
    let existingApplication = await modelAPI.applications.retrieveApplications({search: remoteApplication.application.name})
    if (existingApplication.totalCount > 0) {
      existingApplication = existingApplication.records[0]
      appLogger.log(existingApplication.name + ' already exists')
    }
    else {
      existingApplication = await modelAPI.applications.createApplication(remoteApplication.application.name, remoteApplication.application.description, 2, 1, 'http://set.me.to.your.real.url:8888')
      appLogger.log('Created ' + existingApplication.name)
    }

    let existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({applicationId: existingApplication.id})
    if (existingApplicationNTL.totalCount > 0) {
      appLogger.log(existingApplication.name + ' link already exists')
    }
    else {
      let networkSpecificApplicationInformation = normalizeApplicationData(remoteApplication)
      appLogger.log(networkSpecificApplicationInformation)
      existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.createRemoteApplicationNetworkTypeLink(existingApplication.id, network.networkTypeId, networkSpecificApplicationInformation, existingApplication.companyId)
      appLogger.log(existingApplicationNTL)
      await dataAPI.putProtocolDataForKey(network.id,
        network.networkProtocolId,
        makeApplicationDataKey(existingApplication.id, 'appNwkId'),
        remoteApplication.application.id)
    }
    resolve({localApplication: existingApplication.id, remoteApplication: remoteApplication.application.id})
  })
}

/**
 * Pull remote devices on Lora 1.0 Server
 * @param sessionData
 * @param network
 * @param companyId
 * @param dpMap
 * @param remoteApplicationId
 * @param applicationId
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<any>}
 */
module.exports.pullDevices = function (sessionData, network, remoteApplicationId, localApplicationId, dpMap, modelAPI, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/devices' + '?limit=9999&offset=0&applicationID=' + remoteApplicationId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options, 'error')
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error pulling devices from network ' + network.name + ': ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        body = JSON.parse(body)
        let devices = body.result
        appLogger.log(devices)
        let promiseList = []
        for (let index in devices) {
          let device = devices[index]
          promiseList.push(me.addRemoteDevice(sessionData, device, network, localApplicationId, dpMap, modelAPI, dataAPI))
        }
        Promise.all(promiseList)
          .then((apps) => {
            resolve(apps)
          })
          .catch(err => {
            appLogger.log(err)
            reject(err)
          })
      }
    })
  })
}

module.exports.addRemoteDevice = function (sessionData, limitedRemoteDevice, network, applicationId, dpMap, modelAPI, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let remoteDevice = await getRemoteDeviceById(network, limitedRemoteDevice.devEUI, sessionData.connection, dataAPI)
    appLogger.log('Adding ' + remoteDevice.device.name)
    appLogger.log(remoteDevice)
    let deviceProfileId = dpMap.find(o => o.remoteDeviceProfile === remoteDevice.device.deviceProfileID)
    let deviceProfile = await dataAPI.getDeviceProfileById(deviceProfileId.localDeviceProfile)
    if (deviceProfile.supportsJoin) {
      remoteDevice = await getRemoteDeviceKey(network, remoteDevice, sessionData.connection)
    }
    else {
      remoteDevice = await getRemoteDeviceActivation(network, remoteDevice, sessionData.connection)
    }

    let existingDevice = await modelAPI.devices.retrieveDevices({search: remoteDevice.device.name})
    appLogger.log(existingDevice)
    if (existingDevice.totalCount > 0) {
      existingDevice = existingDevice.records[0]
      appLogger.log(existingDevice.name + ' already exists')
    }
    else {
      appLogger.log('creating ' + remoteDevice.device.name)
      existingDevice = await modelAPI.devices.createDevice(remoteDevice.device.name, remoteDevice.device.description, applicationId)
      appLogger.log('Created ' + existingDevice.name)
    }

    let existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({deviceId: existingDevice.id})
    if (existingDeviceNTL.totalCount > 0) {
      appLogger.log(existingDevice.name + ' link already exists')
    }
    else {
      appLogger.log('creating Network Link for ' + existingDevice.name)
      let normalizedDeviceSettings = normalizeDeviceData(remoteDevice)
      existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.createRemoteDeviceNetworkTypeLink(existingDevice.id, network.networkTypeId, deviceProfileId.localDeviceProfile, normalizedDeviceSettings, 2)
      appLogger.log(existingDeviceNTL)
    }
    dataAPI.putProtocolDataForKey(network.id,
      network.networkProtocolId,
      makeDeviceDataKey(existingDevice.id, 'devNwkId'),
      remoteDevice.device.devEUI)
    resolve(existingDevice.id)
  })
}

/**
 * Set integrations on Lora 1.0 Server to LPWan and update baseUrl for LPWan
 * @param sessionData
 * @param network
 * @param remoteApplicationId
 * @param localApplicationId
 * @param dpMap
 * @param modelAPI
 * @param dataAPI
 * @returns {Promise<any>}
 */
module.exports.pullIntegrations = function (sessionData, network, remoteApplicationId, localApplicationId, dpMap, modelAPI, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/applications/' + remoteApplicationId + '/integrations/http' + '?limit=9999&offset=0'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    appLogger.log(options, 'error')
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error pulling integrations from network ' + network.name + ': ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        let integration = JSON.parse(body)
        integration = integration.integration
        appLogger.log(integration, 'warn')
        var deliveryURL = 'api/ingest/' + localApplicationId + '/' + network.id
        var reportingUrl = nconf.get('base_url') + deliveryURL

        if (integration.dataUpURL === reportingUrl) {
          resolve()
        }
        else {
          modelAPI.applications.retrieveApplication(localApplicationId)
            .then(appToUpdate => {
              appToUpdate.baseUrl = integration.uplinkDataURL
              appLogger.log(appToUpdate, 'warn')
              delete appToUpdate.networks
              modelAPI.applications.updateApplication(appToUpdate)
                .then(result => {
                  appLogger.log(result, 'warn')
                  let options2 = {}
                  options2.method = 'PUT'
                  options2.url = network.baseUrl + '/applications/' + remoteApplicationId + '/integrations/http'
                  options2.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionData.connection
                  }
                  options2.agentOptions = {
                    'secureProtocol': 'TLSv1_2_method',
                    'rejectUnauthorized': false
                  }

                  options2.json = {
                    integration: {
                      ackNotificationURL: reportingUrl,
                      uplinkDataURL: reportingUrl,
                      errorNotificationURL: reportingUrl,
                      id: integration.id,
                      joinNotificationURL: reportingUrl
                    }
                  }
                  appLogger.log(options2)
                  request(options2, function (error, response, body) {
                    if (error) {
                      appLogger.log('Error updating integrations from network ' + network.name + ': ', 'error')
                      appLogger.log(error, 'error')
                      reject(error)
                    }
                    else {
                      appLogger.log('Success Setting Integrations', 'warn')
                      resolve()
                    }
                  })
                })
                .catch(err => {
                  appLogger.log(err)
                  reject(err)
                })
            })
            .catch(err => {
              appLogger.log(err)
              reject(err)
            })
        }
      }
    }
    )
  })
}

//* *****************************************************************************
// CRUD applications.
//* *****************************************************************************

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
module.exports.addApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var application
    var applicationData
    var coNetworkId
    var coSPId
    try {
      // Get the local application data.
      application = await dataAPI.getApplicationById(applicationId)
      applicationData = await dataAPI.getApplicationNetworkType(applicationId, network.networkTypeId)

      coNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(application.companyId, 'coNwkId'))
      coSPId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(application.companyId, 'coSPId'))

      // Set up the request options.
      var options = {}
      options.method = 'POST'
      options.url = network.baseUrl + '/applications'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionData.connection
      }
      appLogger.log(coSPId, 'info')
      appLogger.log(coNetworkId, 'info')

      options.json = deNormalizeApplicationData(applicationData.networkSettings, coSPId, coNetworkId)
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }

      appLogger.log(options, 'info')
      request(options, async function (error, response, body) {
        if (error || response.statusCode >= 400) {
          if (error) {
            appLogger.log('Error on create application: ', 'error')
            appLogger.log(error, 'error')
            reject(error)
          }
          else {
            appLogger.log('Error on create application: ' + JSON.stringify(body) + '(' + response.statusCode + ')')
            reject(response.statusCode)
          }
        }
        else {
          try {
          // Save the application ID from the remote network.
            await dataAPI.putProtocolDataForKey(network.id,
              network.networkProtocolId,
              makeApplicationDataKey(application.id, 'appNwkId'),
              body.id)
          }
          catch (err) {
            reject(err)
          }
          resolve(body.id)
        }
      })
    }
    catch (err) {
      appLogger.log('Failed to get required data for addApplication: ' + err)
      reject(err)
    }
  })
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
module.exports.getApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId'))
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/applications/' + appNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on get application: ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        resolve(body)
      }
    })
  })
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
module.exports.updateApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the application data.
    var application = await dataAPI.getApplicationById(applicationId)
    var coNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeCompanyDataKey(application.companyId, 'coNwkId'))
    var appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId'))
    var applicationData = await dataAPI.getApplicationNetworkType(applicationId, network.networkTypeId)
    let coSPId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeCompanyDataKey(application.companyId, 'coSPId'))

    // Set up the request options.
    var options = {}
    options.method = 'PUT'
    options.url = network.baseUrl + '/applications/' + appNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    // options.json = {
    //   'id': appNetworkId,
    //   'name': application.name,
    //   'organizationID': coNetworkId,
    //   'description': 'This Application is Managed by LPWanServer',
    //   'payloadCodec': '',
    //   'payloadDecoderScript': '',
    //   'payloadEncoderScript': ''
    // }
    options.json = deNormalizeApplicationData(applicationData.networkSettings, coSPId, coNetworkId)
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    // Optional data
    if (applicationData && applicationData.networkSettings) {
      if (applicationData.networkSettings.isABP) {
        options.json.isABP = applicationData.networkSettings.isABP
      }
      if (applicationData.networkSettings.isClassC) {
        options.json.isClassC = applicationData.networkSettings.isClassC
      }
      if (applicationData.networkSettings.relaxFCnt) {
        options.json.relaxFCnt = applicationData.networkSettings.relaxFCnt
      }
      if (applicationData.networkSettings.rXDelay) {
        options.json.rXDelay = applicationData.networkSettings.rXDelay
      }
      if (applicationData.networkSettings.rX1DROffset) {
        options.json.rX1DROffset = applicationData.networkSettings.rX1DROffset
      }
      if (applicationData.networkSettings.rXWindow) {
        options.json.rXWindow = applicationData.networkSettings.rXWindow
      }
      if (applicationData.networkSettings.rX2DR) {
        options.json.rX2DR = applicationData.networkSettings.rX2DR
      }
      if (applicationData.networkSettings.aDRInterval) {
        options.json.aDRInterval = applicationData.networkSettings.aDRInterval
      }
      if (applicationData.networkSettings.installationMargin) {
        options.json.installationMargin = applicationData.networkSettings.installationMargin
      }
      if (applicationData.networkSettings.payloadCodec && applicationData.networkSettings.payloadCodec !== 'NONE') {
        options.json.payloadCodec = applicationData.networkSettings.payloadCodec
      }
      if (applicationData.networkSettings.payloadDecoderScript) {
        options.json.payloadDecoderScript = applicationData.networkSettings.payloadDecoderScript
      }
      if (applicationData.networkSettings.payloadEncoderScript) {
        options.json.payloadEncoderScript = applicationData.networkSettings.payloadEncoderScript
      }
    }
    appLogger.log(application)
    appLogger.log(applicationData)
    appLogger.log(options, 'warn')

    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on update application: ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        appLogger.log(body)
        resolve()
      }
    })
  })
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
module.exports.deleteApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the application data.
    var application = await dataAPI.getApplicationById(applicationId)
    var appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId'))
    // Set up the request options.
    var options = {}
    options.method = 'DELETE'
    options.url = network.baseUrl + '/applications/' + appNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error) {
        appLogger.log('Error on delete application: ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        // get rid of the local copy of the applicationID
        await dataAPI.deleteProtocolDataForKey(
          network.id,
          network.networkProtocolId,
          makeApplicationDataKey(applicationId, 'appNwkId'))
        resolve()
      }
    })
  })
}

//* *****************************************************************************
// Start/Stop Application data delivery.
//* *****************************************************************************
// Used to identify running applications/networks.  Map :A
var activeApplicationNetworkProtocols = {}

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
module.exports.startApplication = function (sessionData, network, applicationId, dataAPI) {
  var me = this
  return new Promise(async function (resolve, reject) {
    try {
      // Create a new endpoint to get POSTs, and call the deliveryFunc.
      // Use the local applicationId and the networkId to create a unique
      // URL.
      var deliveryURL = 'api/ingest/' + applicationId + '/' + network.id
      var reportingAPI = await dataAPI.getReportingAPIByApplicationId(applicationId)

      // Link the reporting API to the application and network.
      activeApplicationNetworkProtocols['' + applicationId + ':' + network.id] = reportingAPI

      // Set up the Forwarding with LoRa App Server
      var appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeApplicationDataKey(applicationId, 'appNwkId'))
      var options = {}
      options.method = 'POST'
      options.url = network.baseUrl + '/applications/' + appNwkId + '/integrations/http'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionData.connection
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      options.json = {}
      options.json.dataUpURL = nconf.get('base_url') + deliveryURL

      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error on add application data reporting: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          resolve()
        }
      })
    }
    catch (err) {
      appLogger.log('Error on add application data reporting: ' + err)
      reject(err)
    }
    ;
  })
}

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
module.exports.stopApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Can't delete if not running on the network.
    if (activeApplicationNetworkProtocols['' + applicationId + ':' + network.id] === undefined) {
      // We don't think the app is running on this network.
      appLogger.log('Application ' + applicationId +
        ' is not running on network ' + network.id)
      reject(404)
      return
    }

    try {
      var appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeApplicationDataKey(applicationId, 'appNwkId'))
    }
    catch (err) {
      appLogger.log('Cannot delete application data forwarding for application ' +
        applicationId +
        ' and network ' +
        network.name +
        ': ' + err)
      reject(err)
      return
    }

    // Kill the Forwarding with LoRa App Server
    var options = {}
    options.method = 'DELETE'
    options.url = network.baseUrl + '/applications/' + appNwkId + '/integrations/http'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on delete application notification: ', 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        // Clear the api entry.
        delete activeApplicationNetworkProtocols['' + applicationId + ':' + network.id]

        // Return success.
        resolve()
      }
    })
  })
}

// Post the data to the remote application server.
//
// networkId     - The network's id that the data is coming from.
// applicationId - The local application's id.
// data          - The data sent.
//
// Redirects the data to the application's server.  Uses the data from the
// remote network to look up the device to include that data as well.
module.exports.passDataToApplication = function (network, applicationId, data, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the reporting API, reject data if not running.
    var reportingAPI = activeApplicationNetworkProtocols['' + applicationId + ':' + network.id]

    if (!reportingAPI) {
      appLogger.log('Rejecting received data from networkId ' + network.id +
        ' for applicationId ' + applicationId +
        '. The appliction is not in a running state.  Data = ' +
        JSON.stringify(data))
      reject('Application not running')
      return
    }

    // This is a stand-alone call, so we'll generate our own data API to access
    // the protocolData.
    // Look up the DevEUI to get the deviceId to pass to the reportingAPI.
    try {
      var deviceId
      if (data.devEUI) {
        var recs = await dataAPI.getProtocolDataWithData(
          network.id,
          'dev:%/devNwkId',
          data.devEUI)
        if (recs && (recs.length > 0)) {
          let splitOnSlash = recs[0].dataIdentifier.split('/')
          let splitOnColon = splitOnSlash[0].split(':')
          deviceId = parseInt(splitOnColon[1])

          let device = await dataAPI.getDeviceById(deviceId)
          data.deviceInfo = {}
          data.deviceInfo.name = device.name
          data.deviceInfo.description = device.description
          data.deviceInfo.model = device.deviceModel
        }
      }

      let app = await dataAPI.getApplicationById(applicationId)

      data.applicationInfo = {}
      data.applicationInfo.name = app.name

      data.networkInfo = {}
      data.networkInfo.name = network.name

      await reportingAPI.report(data, app.baseUrl, app.name)
    }
    catch (err) {
      reject(err)
    }

    resolve()
  })
}

//* *****************************************************************************
// CRUD deviceProfiles.
//* *****************************************************************************

// Add deviceProfile.
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
module.exports.addDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('Adding DP ' + deviceProfileId)
  return new Promise(async function (resolve, reject) {
    var deviceProfile
    try {
      // Get the deviceProfile data.
      deviceProfile = await dataAPI.getDeviceProfileById(deviceProfileId)
      let company = await dataAPI.getCompanyById(2)
      appLogger.log(company)
      let orgId = await dataAPI.getProtocolDataForKey(network.id,
        network.networkProtocolId,
        makeCompanyDataKey(company.id, 'coNwkId'))
      let networkServerId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(company.id, 'coSPNwkId'))

      // Set up the request options.
      var options = {}
      options.method = 'POST'
      options.url = network.baseUrl + '/device-profiles'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionData.connection
      }
      options.json = deNormalizeDeviceProfileData(deviceProfile.networkSettings, networkServerId, orgId)
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }

      appLogger.log(options, 'warn')
      request(options, async function (error, response, body) {
        if (error || response.statusCode >= 400) {
          if (error) {
            appLogger.log('Error on create deviceProfile ' + deviceProfile.name + ':  ', 'error')
            appLogger.log(error, 'error')
            reject(error)
          }
          else {
            appLogger.log('Error on create deviceProfile ' + deviceProfile.name + ':  ' + JSON.stringify(body) + '(' + response.statusCode + ')')
            reject(response.statusCode)
          }
        }
        else {
          // Save the deviceProfile ID from the remote network.
          await dataAPI.putProtocolDataForKey(network.id,
            network.networkProtocolId,
            makeDeviceProfileDataKey(deviceProfile.id, 'dpNwkId'),
            body.id)

          resolve(body.id)
        }
      })
    }
    catch (err) {
      appLogger.log(err)
      reject(err)
    }
  })
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
module.exports.getDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var dpNetworkId
    try {
      dpNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId'))
    }
    catch (err) {
      appLogger.log('Error on get deviceProfile network ID: ' + err)
      reject(err)
      return
    }
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/device-profiles/' + dpNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    request(options, function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get deviceProfile: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error on get deviceProfile: ' + body + '(' + response.statusCode + ')')
          reject(response.statusCode)
        }
      }
      else {
        resolve(body)
      }
    })
  })
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
module.exports.updateDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the application data.
    var deviceProfile
    var dpNetworkId
    var coNetworkId
    try {
      deviceProfile = await dataAPI.getDeviceProfileById(deviceProfileId)
      dpNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId'))
      coNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeCompanyDataKey(deviceProfile.companyId, 'coNwkId'))
    }
    catch (err) {
      appLogger.log('Error getting supporting data for update device Profile: ' + err)
      reject(err)
      return
    }
    // Set up the request options.
    var options = {}
    options.method = 'PUT'
    options.url = network.baseUrl + '/device-profiles/' + dpNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.json = {
      'name': deviceProfile.name,
      'organizationID': coNetworkId
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    // Optional data
    if (deviceProfile.networkSettings) {
      if (deviceProfile.networkSettings.macVersion) {
        options.json.macVersion = deviceProfile.networkSettings.macVersion
      }
      if (deviceProfile.networkSettings.regParamsRevision) {
        options.json.regParamsRevision = deviceProfile.networkSettings.regParamsRevision
      }
      if (deviceProfile.networkSettings.supportsJoin) {
        options.json.supportsJoin = deviceProfile.networkSettings.supportsJoin
      }
      if (deviceProfile.networkSettings.classBTimeout) {
        options.json.classBTimeout = deviceProfile.networkSettings.classBTimeout
      }
      if (deviceProfile.networkSettings.classCTimeout) {
        options.json.classCTimeout = deviceProfile.networkSettings.classCTimeout
      }
      if (deviceProfile.networkSettings.factoryPresetFreqs) {
        options.json.factoryPresetFreqs = deviceProfile.networkSettings.factoryPresetFreqs
      }
      if (deviceProfile.networkSettings.maxDutyCycle) {
        options.json.maxDutyCycle = deviceProfile.networkSettings.maxDutyCycle
      }
      if (deviceProfile.networkSettings.maxEIRP) {
        options.json.maxEIRP = deviceProfile.networkSettings.maxEIRP
      }
      if (deviceProfile.networkSettings.pingSlotDR) {
        options.json.pingSlotDR = deviceProfile.networkSettings.pingSlotDR
      }
      if (deviceProfile.networkSettings.pingSlotFreq) {
        options.json.pingSlotFreq = deviceProfile.networkSettings.pingSlotFreq
      }
      if (deviceProfile.networkSettings.pingSlotPeriod) {
        options.json.pingSlotPeriod = deviceProfile.networkSettings.pingSlotPeriod
      }
      if (deviceProfile.networkSettings.regParamsRevision) {
        options.json.regParamsRevision = deviceProfile.networkSettings.regParamsRevision
      }
      if (deviceProfile.networkSettings.rfRegion) {
        options.json.rfRegion = deviceProfile.networkSettings.rfRegion
      }
      if (deviceProfile.networkSettings.rxDROffset1) {
        options.json.rxDROffset1 = deviceProfile.networkSettings.rxDROffset1
      }
      if (deviceProfile.networkSettings.rxDataRate2) {
        options.json.rxDataRate2 = deviceProfile.networkSettings.rxDataRate2
      }
      if (deviceProfile.networkSettings.rxDelay1) {
        options.json.rxDelay1 = deviceProfile.networkSettings.rxDelay1
      }
      if (deviceProfile.networkSettings.rxFreq2) {
        options.json.rxFreq2 = deviceProfile.networkSettings.rxFreq2
      }
      if (deviceProfile.networkSettings.supports32bitFCnt) {
        options.json.supports32bitFCnt = deviceProfile.networkSettings.supports32bitFCnt
      }
      if (deviceProfile.networkSettings.supportsClassB) {
        options.json.supportsClassB = deviceProfile.networkSettings.supportsClassB
      }
      if (deviceProfile.networkSettings.supportsClassC) {
        options.json.supportsClassC = deviceProfile.networkSettings.supportsClassC
      }
      if (deviceProfile.networkSettings.supportsJoin) {
        options.json.supportsJoin = deviceProfile.networkSettings.supportsJoin
      }
    }

    request(options, function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on put deviceProfile: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error on put deviceProfile: ' + body + '(' + response.statusCode + ')')
          reject(response.statusCode)
        }
      }
      else {
        resolve()
      }
    })
  })
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
module.exports.deleteDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    try {
      // Get the deviceProfile data.
      var deviceProfile = await dataAPI.getDeviceProfileById(deviceProfileId)
      var dpNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId'))
      await dataAPI.deleteProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceProfileDataKey(deviceProfileId, 'dpNwkId'))
    }
    catch (err) {
      appLogger.log('Error getting supporting data for delete deviceProfile: ' + err)
      reject(err)
      return
    }

    // Set up the request options.
    var options = {}
    options.method = 'DELETE'
    options.url = network.baseUrl + '/device-profiles/' + dpNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on delete deviceProfile: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error on delete deviceProfile: ' + body + '(' + response.statusCode + ')')
          reject(response.statusCode)
        }
      }
      else {
        resolve()
      }
    })
  })
}

//* *****************************************************************************
// CRUD devices.
//* *****************************************************************************

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
module.exports.addDevice = function (sessionData, network, deviceId, dataAPI) {
  appLogger.log('Adding Device ' + deviceId + ' to Lora V2 Network')
  return new Promise(async function (resolve, reject) {
    var device
    var dntl
    var deviceProfile
    var appNwkId
    var dpNwkId
    try {
      device = await dataAPI.getDeviceById(deviceId)
      dntl = await dataAPI.getDeviceNetworkType(deviceId, network.networkTypeId)
      deviceProfile = await dataAPI.getDeviceProfileById(dntl.deviceProfileId)
      if (!dntl.networkSettings || !dntl.networkSettings.devEUI) {
        appLogger.log('deviceNetworkTypeLink MUST have networkSettings which MUST have devEUI', 'error')
        reject(400)
        return
      }
      appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeApplicationDataKey(device.applicationId, 'appNwkId'))
      dpNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceProfileDataKey(dntl.deviceProfileId, 'dpNwkId'))

      let loraV2Device = deNormalizeDeviceData(dntl.networkSettings, deviceProfile.networkSettings, appNwkId, dpNwkId)
      // Set up the request options.
      var options = {}
      options.method = 'POST'
      options.url = network.baseUrl + '/devices'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionData.connection
      }
      options.json = {
        device: loraV2Device.device
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }

      appLogger.log(options, 'warn')
      request(options, function (error, response, body) {
        if (error || response.statusCode >= 400) {
          if (error) {
            appLogger.log('Error on create device: ', 'error')
            appLogger.lop(error, 'error')
            appLogger.log(error, 'error')
            reject(error)
          }
          else {
            appLogger.log('Error on create device (' + response.statusCode + '): ', 'error')
            appLogger.log(body, 'error')
            reject(response.statusCode)
          }
        }
        else {
          dataAPI.putProtocolDataForKey(network.id,
            network.networkProtocolId,
            makeDeviceDataKey(device.id, 'devNwkId'),
            loraV2Device.device.devEUI)

          appLogger.log(loraV2Device, 'warn')

          if (deviceProfile.networkSettings.supportsJoin && loraV2Device.deviceKeys) {
            options.url = network.baseUrl + '/devices/' +
              loraV2Device.device.devEUI + '/keys'
            options.json = {
              deviceKeys: loraV2Device.deviceKeys
            }
          }
          else if (loraV2Device.deviceActivation) {
            options.url = network.baseUrl + '/devices/' + loraV2Device.device.devEUI + '/activate'
            options.json = {
              deviceActivation: loraV2Device.deviceActivation
            }
          }
          else {
            appLogger.log('Remote Device ' + loraV2Device.name + ' does not have authentication parameters', 'error')
            resolve(dntl.networkSettings.devEUI)
            return
          }
          appLogger.log(options, 'warn')
          request(options, function (error, response, body) {
            if (error || response.statusCode >= 400) {
              if (error) {
                appLogger.log('Error on create device keys/activation: ', 'error')
                appLogger.log(error)
              }
              else {
                appLogger.log('Error on create device keys/activation (' + response.statusCode + '): ', 'error')
                appLogger.log(body, 'error')
              }
              resolve(dntl.networkSettings.devEUI)
            }
            else {
              resolve(dntl.networkSettings.devEUI)
            }
          })
        }
      })
    }
    catch (err) {
      appLogger.log('Error getting data for remote network: ', 'error')
      appLogger.log(err, 'error')
      reject(err)
    }
  })
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
module.exports.getDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    try {
      var devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceDataKey(deviceId, 'devNwkId'))
    }
    catch (err) {
      reject(err)
      return
    }
    // Set up the request options.
    var options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/devices/' + devNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get device: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error on get device (' + response.statusCode + '): ' + body.error)
          reject(response.statusCode)
        }
      }
      else {
        resolve(body)
      }
    })
  })
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
module.exports.updateDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var device
    var application
    var devNetworkId
    var appNetworkId
    var dpNwkId
    var dntl
    try {
      // Get the device data.
      device = await dataAPI.getDeviceById(deviceId)
      let dp = await dataAPI.getDeviceProfileByDeviceIdNetworkTypeId(deviceId, network.networkTypeId)
      dntl = await dataAPI.getDeviceNetworkType(deviceId, network.networkTypeId)
      devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceDataKey(deviceId, 'devNwkId'))
      appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeApplicationDataKey(device.applicationId, 'appNwkId'))
      dpNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceProfileDataKey(dp.id, 'dpNwkId'))
    }
    catch (err) {
      appLogger.log('Failed to get supporting data for updateDevice: ' + err)
      reject(err)
      return
    }

    // Set up the request options.
    var options = {}
    options.method = 'PUT'
    options.url = network.baseUrl + '/devices/' + devNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.json = {
      'applicationID': appNwkId,
      'description': device.name,
      'devEUI': dntl.networkSettings.devEUI,
      'deviceProfileID': dpNwkId,
      'name': device.name
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    request(options, function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on update device: ', 'error')
          appLogger.log('Error on update device: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error on update device (' + response.statusCode + '): ' + body.error)
          appLogger.log('Error on update device (' + response.statusCode + '): ' + body.error)
          reject(response.statusCode)
        }
      }
      else {
        // Devices have a separate API for appkeys...
        options.url = network.baseUrl + '/devices/' + dntl.networkSettings.devEUI + '/keys'
        options.json = {
          'devEUI': dntl.networkSettings.devEUI,
          'deviceKeys': {
            'appKey': dntl.networkSettings.appKey
          }
        }
        request(options, function (error, response, body) {
          if (error || response.statusCode >= 400) {
            if (error) {
              appLogger.log('Error on update device keys: ', 'error')
            }
            else {
              appLogger.log('Error on update device keys (' + response.statusCode + '): ' + body.error)
            }
            resolve()
          }
          else {
            resolve()
          }
        })
      }
    })
  })
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
module.exports.deleteDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var devNetworkId
    try {
      devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceDataKey(deviceId, 'devNwkId'))
    }
    catch (err) {
      // Can't delete without the remote ID.
      appLogger.log("Failed to get remote network's device ID: " + err)
      reject(err)
      return
    }

    // Set up the request options.
    var options = {}
    options.method = 'DELETE'
    options.url = network.baseUrl + '/devices/' + devNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on delete device: ', 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          appLogger.log('Error on delete device (' + response.statusCode + '): ' + body.error)
          reject(response.statusCode)
        }
      }
      else {
        // Deleted device, network key is no longer valid.
        try {
          await dataAPI.deleteProtocolDataForKey(
            network.id,
            network.networkProtocolId,
            makeDeviceDataKey(deviceId, 'devNwkId'))
        }
        catch (err) {
          appLogger.log("Failed to delete remote network's device ID: " + err)
        }

        // Devices have a separate API for appkeys...
        options.url = network.baseUrl + '/devices/' + devNetworkId + '/keys'
        request(options, function (error, response, body) {
          if (error || response.statusCode >= 400) {
            if (error) {
              appLogger.log('Error on delete device keys: ', 'error')
            }
            else {
              appLogger.log('Error on delete device keys (' + response.statusCode + '): ' + body.error)
            }
            resolve()
          }
          else {
            resolve()
          }
        })
        resolve()
      }
    })
  })
}

function normalizeApplicationData (remoteApplication) {
  /*
 "application": {
        "description": "string",
        "id": "string",
        "name": "string",
        "organizationID": "string",
        "payloadCodec": "string",
        "payloadDecoderScript": "string",
        "payloadEncoderScript": "string",
        "serviceProfileID": "string"
      }
   */
  let normalized = {
    description: remoteApplication.application.description,
    id: remoteApplication.application.id,
    name: remoteApplication.application.name,
    organizationID: remoteApplication.application.organizationID,
    payloadCodec: remoteApplication.application.payloadCodec,
    payloadDecoderScript: remoteApplication.application.payloadDecoderScript,
    payloadEncoderScript: remoteApplication.application.payloadEncoderScript,
    serviceProfileID: remoteApplication.application.serviceProfileID,
    cansend: true,
    deviceLimit: null,
    devices: null,
    overbosity: null,
    ogwinfo: null,
    orx: true,
    canotaa: true,
    suspended: false,
    clientsLimit: null,
    joinServer: null
  }
  return normalized
}

function deNormalizeApplicationData (remoteApplication, serviceProfile, organizationId) {
  let loraV2ApplicationData = {
    application: {
      'description': remoteApplication.description,
      'name': remoteApplication.name,
      'organizationID': organizationId,
      'payloadCodec': remoteApplication.payloadCodec,
      'payloadDecoderScript': remoteApplication.payloadDecoderScript,
      'payloadEncoderScript': remoteApplication.payloadEncoderScript,
      'serviceProfileID': serviceProfile
    }
  }
  return loraV2ApplicationData
}

function normalizeDeviceProfileData (remoteDeviceProfile) {
  /*
  "createdAt": "2018-09-05T05:28:09.681Z",
      "deviceProfile": {
        "classBTimeout": 0,
        "classCTimeout": 0,
        "factoryPresetFreqs": [
          0
        ],
        "id": "string",
        "macVersion": "string",
        "maxDutyCycle": 0,
        "maxEIRP": 0,
        "name": "string",
        "networkServerID": "string",
        "organizationID": "string",
        "pingSlotDR": 0,
        "pingSlotFreq": 0,
        "pingSlotPeriod": 0,
        "regParamsRevision": "string",
        "rfRegion": "string",
        "rxDROffset1": 0,
        "rxDataRate2": 0,
        "rxDelay1": 0,
        "rxFreq2": 0,
        "supports32BitFCnt": true,
        "supportsClassB": true,
        "supportsClassC": true,
        "supportsJoin": true
      },
      "updatedAt": "2018-09-05T05:28:09.682Z"
   */
  let normalized = {
    classBTimeout: remoteDeviceProfile.deviceProfile.classBTimeout,
    classCTimeout: remoteDeviceProfile.deviceProfile.classCTimeout,
    factoryPresetFreqs: remoteDeviceProfile.deviceProfile.factoryPresetFreqs,
    id: remoteDeviceProfile.deviceProfile.id,
    macVersion: remoteDeviceProfile.deviceProfile.macVersion,
    maxDutyCycle: remoteDeviceProfile.deviceProfile.maxDutyCycle,
    maxEIRP: remoteDeviceProfile.deviceProfile.maxEIRP,
    name: remoteDeviceProfile.deviceProfile.name,
    networkServerID: remoteDeviceProfile.deviceProfile.networkServerID,
    organizationID: remoteDeviceProfile.deviceProfile.organizationID,
    pingSlotDR: remoteDeviceProfile.deviceProfile.pingSlotDR,
    pingSlotFreq: remoteDeviceProfile.deviceProfile.pingSlotFreq,
    pingSlotPeriod: remoteDeviceProfile.deviceProfile.pingSlotPeriod,
    regParamsRevision: remoteDeviceProfile.deviceProfile.regParamsRevision,
    rfRegion: remoteDeviceProfile.deviceProfile.rfRegion,
    rxDROffset1: remoteDeviceProfile.deviceProfile.rxDROffset1,
    rxDataRate2: remoteDeviceProfile.deviceProfile.rxDataRate2,
    rxDelay1: remoteDeviceProfile.deviceProfile.rxDelay1,
    rxFreq2: remoteDeviceProfile.deviceProfile.rxFreq2,
    supports32BitFCnt: remoteDeviceProfile.deviceProfile.supports32bitFCnt,
    supportsClassB: remoteDeviceProfile.deviceProfile.supportsClassB,
    supportsClassC: remoteDeviceProfile.deviceProfile.supportsClassC,
    supportsJoin: remoteDeviceProfile.deviceProfile.supportsJoin
  }
  return normalized
}

function deNormalizeDeviceProfileData (remoteDeviceProfile, networkServerId, organizationId) {
  /*
    "createdAt": "2018-09-05T05:28:09.681Z",
      "deviceProfile": {
        "classBTimeout": 0,
        "classCTimeout": 0,
        "factoryPresetFreqs": [
          0
        ],
        "id": "string",
        "macVersion": "string",
        "maxDutyCycle": 0,
        "maxEIRP": 0,
        "name": "string",
        "networkServerID": "string",
        "organizationID": "string",
        "pingSlotDR": 0,
        "pingSlotFreq": 0,
        "pingSlotPeriod": 0,
        "regParamsRevision": "string",
        "rfRegion": "string",
        "rxDROffset1": 0,
        "rxDataRate2": 0,
        "rxDelay1": 0,
        "rxFreq2": 0,
        "supports32BitFCnt": true,
        "supportsClassB": true,
        "supportsClassC": true,
        "supportsJoin": true
      },
      "updatedAt": "2018-09-05T05:28:09.682Z"
   */
  let loraV2DeviceProfileData = {
    deviceProfile: {
      classBTimeout: remoteDeviceProfile.classBTimeout,
      classCTimeout: remoteDeviceProfile.classCTimeout,
      factoryPresetFreqs: remoteDeviceProfile.factoryPresetFreqs,
      macVersion: remoteDeviceProfile.macVersion,
      maxDutyCycle: remoteDeviceProfile.maxDutyCycle,
      maxEIRP: remoteDeviceProfile.maxEIRP,
      pingSlotDR: remoteDeviceProfile.pingSlotDR,
      pingSlotFreq: remoteDeviceProfile.pingSlotFreq,
      pingSlotPeriod: remoteDeviceProfile.pingSlotPeriod,
      regParamsRevision: remoteDeviceProfile.regParamsRevision,
      rfRegion: remoteDeviceProfile.rfRegion,
      rxDROffset1: remoteDeviceProfile.rxDROffset1,
      rxDataRate2: remoteDeviceProfile.rxDataRate2,
      rxDelay1: remoteDeviceProfile.rxDelay1,
      rxFreq2: remoteDeviceProfile.rxFreq2,
      supports32BitFCnt: remoteDeviceProfile.supports32BitFCnt,
      supportsClassB: remoteDeviceProfile.supportsClassB,
      supportsClassC: remoteDeviceProfile.supportsClassC,
      supportsJoin: remoteDeviceProfile.supportsJoin,
      name: remoteDeviceProfile.name,
      networkServerID: networkServerId,
      organizationID: organizationId
    }

  }
  return loraV2DeviceProfileData
}

function normalizeDeviceData (remoteDevice) {
  /*
        "applicationID": "string",
      "description": "string",
      "devEUI": "string",
      "deviceProfileID": "string",
      "name": "string",
      "skipFCntCheck": true,
      "deviceStatusBattery": 0,
      "deviceStatusMargin": 0,
      "lastSeenAt": "2018-09-05T05:28:09.738Z"
"deviceActivation": {
    "aFCntDown": 0,
    "appSKey": "string",
    "devAddr": "string",
    "devEUI": "string",
    "fCntUp": 0,
    "fNwkSIntKey": "string",
    "nFCntDown": 0,
    "nwkSEncKey": "string",
    "sNwkSIntKey": "string"
  }
   "deviceKeys": {
    "appKey": "string",
    "devEUI": "string",
    "nwkKey": "string"
  }
   */
  let normalized = {
    applicationID: remoteDevice.device.applicationID,
    description: remoteDevice.device.description,
    devEUI: remoteDevice.device.devEUI,
    deviceProfileID: remoteDevice.device.deviceProfileID,
    name: remoteDevice.device.name,
    skipFCntCheck: remoteDevice.device.skipFCntCheck,
    deviceStatusBattery: remoteDevice.deviceStatusBattery,
    deviceStatusMargin: remoteDevice.deviceStatusMargin,
    lastSeenAt: remoteDevice.lastSeenAt
  }
  if (remoteDevice.device.deviceKeys) {
    normalized.deviceKeys = {
      appKey: remoteDevice.device.deviceKeys.appKey,
      devEUI: remoteDevice.device.deviceKeys.devEUI,
      nwkKey: remoteDevice.device.deviceKeys.nwkKey
    }
  }

  if (remoteDevice.device.deviceActivation) {
    normalized.deviceActivation = {
      aFCntDown: remoteDevice.device.deviceActivation.aFCntDown,
      appSKey: remoteDevice.device.deviceActivation.appSKey,
      devAddr: remoteDevice.device.deviceActivation.devAddr,
      devEUI: remoteDevice.device.deviceActivation.devEUI,
      fCntUp: remoteDevice.device.deviceActivation.fCntUp,
      nFCntDown: remoteDevice.device.deviceActivation.nFCntDown,
      nwkSEncKey: remoteDevice.device.deviceActivation.nwkSEncKey,
      sNwkSIntKey: remoteDevice.device.deviceActivation.sNwkSIntKey,
      fNwkSIntKey: remoteDevice.device.deviceActivation.fNwkSIntKey
    }
  }
  return normalized
}

/**
 * @see ./data/json/lora2.json
 *
 * @param remoteDevice
 * @returns {{device: {applicationID: (*|string), description: *, devEUI: *, deviceProfileID: *, name: *, skipFCntCheck: (*|boolean)}, deviceStatusBattery: number, deviceStatusMargin: number, lastSeenAt: (string|null)}}
 */
function deNormalizeDeviceData (remoteDevice, deviceProfile, appId, dpId) {
  let loraV2DeviceData = {
    device: {
      applicationID: appId,
      description: remoteDevice.description,
      devEUI: remoteDevice.devEUI,
      deviceProfileID: dpId,
      name: remoteDevice.name,
      skipFCntCheck: remoteDevice.skipFCntCheck
    }
  }
  if (remoteDevice.deviceKeys) {
    if (deviceProfile.macVersion === '1.1.0') {
      loraV2DeviceData.deviceKeys = {
        appKey: remoteDevice.deviceKeys.appKey,
        nwkKey: remoteDevice.deviceKeys.nwkKey,
        devEUI: remoteDevice.deviceKeys.devEUI
      }
    }
    else {
      loraV2DeviceData.deviceKeys = {
        nwkKey: remoteDevice.deviceKeys.appKey,
        devEUI: remoteDevice.deviceKeys.devEUI,
        appKey: remoteDevice.deviceKeys.appKey
      }
    }
  }
  if (remoteDevice.deviceActivation) {
    loraV2DeviceData.deviceActivation = {
      appSKey: remoteDevice.deviceActivation.appSKey,
      devAddr: remoteDevice.deviceActivation.devAddr,
      aFCntDown: remoteDevice.deviceActivation.aFCntDown,
      nFCntDown: remoteDevice.deviceActivation.nFCntDown,
      fCntUp: remoteDevice.deviceActivation.fCntUp,
      nwkSEncKey: remoteDevice.deviceActivation.nwkSEncKey,
      sNwkSIntKey: remoteDevice.deviceActivation.sNwkSIntKey,
      fNwkSIntKey: remoteDevice.deviceActivation.fNwkSIntKey
    }
  }
  appLogger.log(remoteDevice, 'warn')
  appLogger.log(loraV2DeviceData, 'warn')
  return loraV2DeviceData
}
