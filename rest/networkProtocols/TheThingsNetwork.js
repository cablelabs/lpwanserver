
const request = require('request')
const nconf = require('nconf')
const appLogger = require('../lib/appLogger.js')

// ********************************************************
// Authentication
// ********************************************************

//
// dataAPI - The API that handles common data access and manipulation functions
//           on behalf of the protocol.
// network - The network that we are to get the company account info for.  For
//           The Things Network, this is a lpwan TTN user account.
exports.getCompanyAccessAccount = async function (dataAPI, network) {
  let secData = network.securityData
  appLogger.log(secData)
  if (!secData || !secData.username || !secData.password) {
    appLogger.log('Network security data is incomplete for ' + network.name)
    dataAPI.addLog(network, 'Network security data is incomplete for ' + network.name)
    return null
  }
  return {
    username: secData.username,
    password: secData.password,
    admin: true
  }
}

// The login account data needed to manipulate applications.  For The Things Network
// Source, this is the company admin account.
//
// dataAPI       - The API that handles common data access and manipulation
//                 functions on behalf of the protocol.
// network - The network that we are to get the application account info for.
//           For The Things Network, this is a company account.
// applicationId - The id of the local application record, used to get to the
//                 company.
exports.getApplicationAccessAccount = async function (dataAPI, network, applicationId) {
  // Get the company for this application.
  var co = await dataAPI.getCompanyByApplicationId(applicationId)

  // Return the account info.  Don't generate a new account - it must already
  // be there.
  return getCompanyAccount(dataAPI, network, co.id, false)
}

// The login account data needed to manipulate devices.  For The Things Network
// Source, this is the company admin account.
//
// dataAPI  - The API that handles common data access and manipulation
//            functions on behalf of the protocol.
// network  - The network that we are to get the application account info for.
//            For The Things Network, this is a company account.
// deviceId - The id of the local device record, used to get to the
//            company.
exports.getDeviceAccessAccount = async function (dataAPI, network, deviceId) {
  // Get the company for this device.
  var co = await dataAPI.getCompanyByDeviceId(deviceId)

  // Return the account info.  Don't generate a new account - it must already
  // be there.
  return getCompanyAccount(dataAPI, network, co.id, false)
}

// The login account data needed to manipulate deviceProfiles.  For The Things Network
// Source, this is the company admin account.
//
// dataAPI         - The API that handles common data access and manipulation
//                   functions on behalf of the protocol.
// network         - The network that we are to get the application account info
//                   for. For The Things Network, this is a company account.
// deviceProfileId - The id of the local device record, used to get to the
//                   company.
exports.getDeviceProfileAccessAccount = async function (dataAPI, network, deviceId) {
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
  try {
    srd = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeCompanyDataKey(companyId, 'sd'))

    kd = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeCompanyDataKey(companyId, 'kd'))
  } catch (err) {
    dataAPI.addLog(network,
      'Company security data is missing for company id ' +
      companyId)
    return null
  }
  try {
    var secData = await dataAPI.access(network, srd, kd)
  } catch (err) {
    return null
  }

  if (!secData.username || !secData.password) {
    dataAPI.addLog(network,
      'Company security data is incomplete for company id ' +
      companyId)
    return null
  }

  return secData
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
exports.connect = function (network, loginData) {
  return new Promise(function (resolve, reject) {
    // Set up the request options.
    var options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/users/token'
    options.headers = {'Content-Type': 'application/json'}
    options.json = loginData
    options.agentOptions = {'secureProtocol': 'TLSv1_2_method', 'rejectUnauthorized': false}

    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on sign in: ' + error)
        reject(error)
      } else if (response.statusCode >= 400) {
        appLogger.log('Error on sign in: ' + response.statusCode + ', ' + response.body.error)
        reject(response.statusCode)
      } else {
        var token = body.jwt
        if (token) {
          resolve(token)
        } else {
          reject(new Error('No token'))
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
exports.disconnect = function (connection) {
  return new Promise(function (resolve, reject) {
    // LoRa app server doesn't have a logout.  Just clear the token.
    connection = null
    resolve()
  })
}

// ********************************************************
// Utilities
// ********************************************************

// Get the NetworkServer using the Service Profile a ServiceProfile.
function getDeviceById (network, deviceId, connection, dataAPI) {
  appLogger.log('TheThingsNetwork: getDeviceProfileById')
  return new Promise(async function (resolve, reject) {
    // Set up the request options.
    var options = {}
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
    appLogger.log(options)
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          dataAPI.addLog(network, 'Error on get Device: ' + error)
          reject(error)
        } else {
          var bodyObj = JSON.parse(response.body)
          dataAPI.addLog(network, 'Error on get Device: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          dataAPI.addLog(network, 'Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      } else {
        // Convert text to JSON array, use id from first element
        var res = JSON.parse(body)
        appLogger.log(res)
        resolve(res)
      }
    })
  })
};

// Get the NetworkServer using the Service Profile a ServiceProfile.
function getApplicationById (network, applicationId, connection, dataAPI) {
  appLogger.log('TheThingsNetwork: getApplicationById')
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

    appLogger.log(options)
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          dataAPI.addLog(network, 'Error on get Application: ' + error)
          reject(error)
        } else {
          var bodyObj = JSON.parse(response.body)
          dataAPI.addLog(network, 'Error on get Application: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          dataAPI.addLog(network, 'Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      } else {
        // Convert text to JSON array, use id from first element
        var res = JSON.parse(body)
        appLogger.log(res)
        resolve(res)
      }
    })
  })
}

function addRemoteApplication (sessionData, limitedRemoteApplication, network, companyMap, dpMap, dataAPI, modelAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let remoteApplication = await getApplicationById(network, limitedRemoteApplication.id, sessionData.connection, dataAPI)
    appLogger.log('Adding ' + remoteApplication.name)
    appLogger.log(remoteApplication)
    let existingApplication = await modelAPI.applications.retrieveApplications({search: remoteApplication.name})
    appLogger.log(existingApplication)
    if (existingApplication.totalCount > 0) {
      existingApplication = existingApplication.records[0]
      appLogger.log(existingApplication.name + ' already exists')
    } else {
      appLogger.log('creating ' + remoteApplication.name)
      let company = companyMap.find(o => o.organizationId === remoteApplication.organizationID)
      appLogger.log(company)
      appLogger.log(companyMap)
      existingApplication = await modelAPI.applications.createApplication(remoteApplication.name, remoteApplication.description, company.companyId, 1, 'http://set.me.to.your.real.url:8888')
      appLogger.log('Created ' + existingApplication.name)
    }

    let existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({applicationId: existingApplication.id})
    if (existingApplicationNTL.totalCount > 0) {
      appLogger.log(existingApplication.name + ' link already exists')
    } else {
      appLogger.log('creating Network Link for ' + existingApplication.name)
      // let serviceProfile = await getServiceProfileById(network, remoteApplication.serviceProfileID, sessionData.connection, dataAPI);
      // let networkServer = await getNetworkServerById(network, serviceProfile.networkServerID, sessionData.connection, dataAPI);
      // appLogger.log('Got SP and NS');
      // appLogger.log(serviceProfile);
      // appLogger.log(networkServer);
      // delete existingApplicationNTL.remoteAccessLogs;
      let networkSettings = {
        payloadCodec: remoteApplication.payloadCodec,
        payloadDecoderScript: remoteApplication.payloadDecoderScript,
        payloadEncoderScript: remoteApplication.payloadEncoderScript
      }
      existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.createRemoteApplicationNetworkTypeLink(existingApplication.id, network.networkTypeId, networkSettings, existingApplication.companyId)
      appLogger.log(existingApplicationNTL)
      await dataAPI.putProtocolDataForKey(network.id,
        network.networkProtocolId,
        makeApplicationDataKey(existingApplication.id, 'appNwkId'),
        remoteApplication.id)
    }
    me.pullDevices(sessionData, network, existingApplication.companyId, dpMap, remoteApplication.id, existingApplication.id, dataAPI, modelAPI)
      .then((result) => {
        appLogger.log('Success in pulling devices from ' + network.name)
        appLogger.log(result)
        resolve(existingApplication.id)
      })
      .catch((err) => {
        appLogger.log('Failed to pull devices from ' + network.name)
        reject(err)
      })
  })
}

function addRemoteDevice (sessionData, limitedRemoteDevice, network, companyId, dpMap, remoteApplicationId, applicationId, dataAPI, modelAPI) {
  return new Promise(async function (resolve, reject) {
    let remoteDevice = await getDeviceById(network, limitedRemoteDevice.devEUI, sessionData.connection, dataAPI)
    appLogger.log('Adding ' + remoteDevice.name)
    appLogger.log(remoteDevice)
    let deviceProfile = dpMap.find(o => o.remoteDeviceProfileId === remoteDevice.deviceProfileID)
    appLogger.log(deviceProfile)
    let existingDevice = await modelAPI.devices.retrieveDevices({search: remoteDevice.name})
    appLogger.log(existingDevice)
    if (existingDevice.totalCount > 0) {
      existingDevice = existingDevice.records[0]
      appLogger.log(existingDevice.name + ' already exists')
    } else {
      appLogger.log('creating ' + remoteDevice.name)
      existingDevice = await modelAPI.devices.createDevice(remoteDevice.name, remoteDevice.description, applicationId)
      appLogger.log('Created ' + existingDevice.name)
    }

    let existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({deviceId: existingDevice.id})
    if (existingDeviceNTL.totalCount > 0) {
      appLogger.log(existingDevice.name + ' link already exists')
    } else {
      appLogger.log('creating Network Link for ' + existingDevice.name)
      existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.createRemoteDeviceNetworkTypeLink(existingDevice.id, network.networkTypeId, deviceProfile.deviceProfileId, remoteDevice, companyId)
      appLogger.log(existingDeviceNTL)
      dataAPI.putProtocolDataForKey(network.id,
        network.networkProtocolId,
        makeDeviceDataKey(existingDevice.id, 'devNwkId'),
        remoteDevice.devEUI)
    }
    resolve(existingDevice.id)
  })
}

// **********************************************
// Pull/Push Remote Data
// **********************************************

// Pull data from the TTN Network
//
// sessionData - The session information for the user, including the
//               connection data for the remote system.
// network     - The networks record for the network that uses this
//               protocol.
// companyId   - The id for the local company data, for which the remote data
//               will be retrieved.
// dataAPI     - Gives access to the data records and error tracking for the
//               operation.
//
// Returns a Promise that gets the company record from the remote system.
exports.pullNetwork = function (sessionData, network, dataAPI, modelAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    me.pullCompanies(sessionData, network, dataAPI, modelAPI)
      .then((companyMap) => {
        appLogger.log('Success in pulling organizations from ' + network.name)
        appLogger.log(companyMap)
        me.pullDeviceProfiles(sessionData, network, companyMap, dataAPI, modelAPI)
          .then((dpMap) => {
            appLogger.log('Success in pulling device profiles from ' + network.name)
            appLogger.log(dpMap)

            me.pullApplications(sessionData, network, companyMap, dpMap, dataAPI, modelAPI)
              .then((applicationMap) => {
                appLogger.log('Success in pulling applications from ' + network.name)
                appLogger.log(applicationMap)
                // me.pullDevices(sessionData, network, companyMap, applicationMap, dpMap, dataAPI, modelAPI)
                //     .then((result) => {
                //         appLogger.log('Success in pulling devices from ' + network.name);
                //         appLogger.log(result);
                //         resolve();
                //     })
                //     .catch((err) => {
                //         appLogger.log('Failed to pull devices from ' + network.name);
                //         reject(err);
                //     })
                resolve()
              })
              .catch((err) => {
                appLogger.log('Failed to pull applications from ' + network.name)
                reject(err)
              })
          })
          .catch((err) => {
            appLogger.log('Failed to pull device profiles from ' + network.name)
            reject(err)
          })
      })
      .catch((err) => {
        appLogger.log('Failed to pull organizations from ' + network.name)
        reject(err)
      })
  })
}

exports.pullApplications = function (sessionData, network, companyMap, dpMap, dataAPI, modelAPI) {
  let counter = 0
  return new Promise(async function (resolve, reject) {
    let applicationMap = []
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/applications' + '?limit=9999&offset=0'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options)
    request(options, function (error, response, body) {
      if (error) {
        dataAPI.addLog(network, 'Error pulling applications from network ' + network.name + ': ' + error)
        reject(error)
      } else {
        body = JSON.parse(body)
        dataAPI.addLog(network, body)
        if (body.totalCount === 0) {
          appLogger.log('No apps')
          appLogger.log(body)
          resolve(applicationMap)
        } else {
          let apps = body.result
          appLogger.log(body)
          counter = apps.length
          for (let index in apps) {
            let app = apps[index]
            appLogger.log('Added ' + app.name)
            addRemoteApplication(sessionData, app, network, companyMap, dpMap, dataAPI, modelAPI)
              .then((applicationId) => {
                counter = counter - 1
                applicationMap.push({remoteApplicationId: app.id, applicationId: applicationId})
                if (counter <= 0) {
                  resolve(applicationMap)
                }
              })
              .catch((error) => {
                reject(error)
              })
          }
        }
      }
    })
  })
}

exports.pullDevices = function (sessionData, network, companyId, dpMap, remoteApplicationId, applicationId, dataAPI, modelAPI) {
  let counter = 0
  return new Promise(async function (resolve, reject) {
    let deviceMap = []
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/applications/' + remoteApplicationId + '/devices' + '?limit=9999&offset=0'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options)
    request(options, function (error, response, body) {
      if (error) {
        dataAPI.addLog(network, 'Error pulling devices from network ' + network.name + ': ' + error)
        reject(error)
      } else {
        appLogger.log(body)
        body = JSON.parse(body)
        dataAPI.addLog(network, body)
        if (body.totalCount === 0) {
          appLogger.log('No devices')
          appLogger.log(body)
          resolve(deviceMap)
        } else {
          let devices = body.result
          appLogger.log(body)
          counter = devices.length
          for (let index in devices) {
            let device = devices[index]
            appLogger.log('Added ' + device.name)
            addRemoteDevice(sessionData, device, network, companyId, dpMap, remoteApplicationId, applicationId, dataAPI, modelAPI)
              .then((deviceId) => {
                counter = counter - 1
                deviceMap.push({remoteDeviceId: device.id, deviceId: deviceId})
                if (counter <= 0) {
                  resolve(deviceMap)
                }
              })
              .catch((error) => {
                reject(error)
              })
          }
        }
      }
    })
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
exports.addApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var application
    try {
      // Get the local application data.
      application = await dataAPI.getApplicationById(applicationId)
    } catch (err) {
      dataAPI.addLog(network, 'Failed to get required data for addApplication: ' + err)
      reject(err)
      return
    }
    // Set up the request options.
    var options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/applications'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.json = {
      'name': application.name
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          dataAPI.addLog(network, 'Error on create application: ' + error)
          reject(error)
        } else {
          dataAPI.addLog(network, 'Error on create application: ' + JSON.stringify(body) + '(' + response.statusCode + ')')
          reject(response.statusCode)
        }
      } else {
        try {
          // Save the application ID from the remote network.
          await dataAPI.putProtocolDataForKey(network.id,
            network.networkProtocolId,
            makeApplicationDataKey(application.id, 'appNwkId'),
            body.id)
        } catch (err) {
          reject(err)
        }
        resolve(body.id)
      }
    })
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
exports.getApplication = function (sessionData, network, applicationId, dataAPI) {
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
        dataAPI.addLog(network, 'Error on get application: ' + error)
        reject(error)
      } else {
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
exports.updateApplication = function (sessionData, network, applicationId, dataAPI) {
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

    // Set up the request options.
    var options = {}
    options.method = 'PUT'
    options.url = network.baseUrl + '/applications/' + appNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.json = {
      'id': appNetworkId,
      'name': application.name,
      'organizationID': coNetworkId,
      'description': 'This Application is Managed by LPWanServer',
      'payloadCodec': '',
      'payloadDecoderScript': '',
      'payloadEncoderScript': ''
    }
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
    appLogger.log(options)

    request(options, function (error, response, body) {
      if (error) {
        dataAPI.addLog(network, 'Error on update application: ' + error)
        reject(error)
      } else {
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
exports.deleteApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the application data.
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
        dataAPI.addLog(network, 'Error on delete application: ' + error)
        reject(error)
      } else {
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
exports.pushApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Try a "get" to see if the application is already there.
    // eslint-disable-next-line no-unused-vars
    let app
    try {
      app = await exports.getApplication(sessionData, network, applicationId, dataAPI)
    } catch (err) {
      if (err === 404) {
        // Need to create, then.
        let appid
        try {
          appid = await exports.addApplication(sessionData, network, applicationId, dataAPI)
          resolve(appid)
        } catch (err) {
          reject(err)
        }
        return
      } else {
        reject(err)
        return
      }
    }

    // Get worked - do an update.
    try {
      await exports.updateApplication(sessionData, network, applicationId, dataAPI)
    } catch (err) {
      reject(err)
    }
    resolve()
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
exports.startApplication = function (sessionData, network, applicationId, dataAPI) {
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
          dataAPI.addLog(network, 'Error on add application data reporting: ' + error)
          reject(error)
        } else {
          resolve()
        }
      })
    } catch (err) {
      dataAPI.addLog(network, 'Error on add application data reporting: ' + err)
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
exports.stopApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Can't delete if not running on the network.
    if (activeApplicationNetworkProtocols['' + applicationId + ':' + network.id] === undefined) {
      // We don't think the app is running on this network.
      dataAPI.addLog(network, 'Application ' + applicationId +
        ' is not running on network ' + network.id)
      reject(new Error('Application ' + applicationId +
        ' is not running on network ' + network.id))
    }

    try {
      var appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeApplicationDataKey(applicationId, 'appNwkId'))
    } catch (err) {
      dataAPI.addLog(network, 'Cannot delete application data forwarding for application ' +
        applicationId +
        ' and network ' +
        network.name +
        ': ' + err)
      reject(err)
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
        dataAPI.addLog(network, 'Error on delete application notification: ' + error)
        reject(error)
      } else {
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
exports.passDataToApplication = function (network, applicationId, data, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the reporting API, reject data if not running.
    var reportingAPI = activeApplicationNetworkProtocols['' + applicationId + ':' + network.id]

    if (!reportingAPI) {
      appLogger.log('Rejecting received data from networkId ' + network.id +
        ' for applicationId ' + applicationId +
        '. The appliction is not in a running state.  Data = ' +
        JSON.stringify(data))
      reject(new Error('Application ' + applicationId +
        ' is not running on network ' + network.id))
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
    } catch (err) {
      reject(err)
    }

    resolve()
  })
}

//* *****************************************************************************
// CRUD devices.
//* *****************************************************************************

// Add device.
//
// sessionData     - The session information for the user, including the
//                   connection data for the remote system.
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
exports.addDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var device
    var dntl
    var devpro
    var appNwkId
    var dpNwkId
    try {
      device = await dataAPI.getDeviceById(deviceId)
      dntl = await dataAPI.getDeviceNetworkType(deviceId, network.networkTypeId)
      devpro = await dataAPI.getDeviceProfileById(dntl.deviceProfileId)
      if (!dntl.networkSettings || !dntl.networkSettings.devEUI) {
        dataAPI.addLog(network, 'deviceNetworkTypeLink MUST have networkSettings which MUST have devEUI')
        reject(new Error('deviceNetworkTypeLink MUST have networkSettings which MUST have devEUI'))
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
    } catch (err) {
      dataAPI.addLog(network, 'Error getting data for remote network: ' + err)
      reject(err)
      return
    }
    // Set up the request options.
    var options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/devices'
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

    // Optional data
    var devNS = dntl.networkSettings

    request(options, function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          dataAPI.addLog(network, 'Error on create device: ' + error)
          reject(error)
        } else {
          dataAPI.addLog(network, 'Error on create device (' + response.statusCode + '): ' + body.error)
          reject(response.statusCode)
        }
      } else {
        // The Things Network uses the DevEUI as the node id.
        dataAPI.putProtocolDataForKey(network.id,
          network.networkProtocolId,
          makeDeviceDataKey(device.id, 'devNwkId'),
          options.json.devEUI)

        // Devices have to do a second call to set up either the
        // Application Key (OTAA) or the Keys for ABP.
        if (!devpro.networkSettings.supportsJoin) {
          // This is the ABP path.
          options.url = network.baseUrl + '/devices/' +
            dntl.networkSettings.devEUI + '/activate'
          options.json = {
            'devEUI': dntl.networkSettings.devEUI,
            'devAddr': dntl.networkSettings.devAddr,
            'nwkSKey': dntl.networkSettings.nwkSKey,
            'appSKey': dntl.networkSettings.appSKey,
            'fCntUp': dntl.networkSettings.fCntUp,
            'fCntDown': dntl.networkSettings.fCntDown,
            'skipFCntCheck':
            dntl.networkSettings.skipFCntCheck
          }
          appLogger.log('options.json = ' + JSON.stringify(options.json))
        } else {
          // This is the OTAA path.
          options.url = network.baseUrl + '/devices/' +
            dntl.networkSettings.devEUI + '/keys'
          options.json = {
            'devEUI': dntl.networkSettings.devEUI,
            'deviceKeys': {
              'appKey': devNS.appKey
            }
          }
        }
        request(options, function (error, response, body) {
          if (error || response.statusCode >= 400) {
            if (error) {
              dataAPI.addLog(network, 'Error on create device keys: ' + error)
            } else {
              dataAPI.addLog(network, 'Error on create device keys (' + response.statusCode + '): ' + body.error)
            }
            resolve(dntl.networkSettings.devEUI)
          } else {
            resolve(dntl.networkSettings.devEUI)
          }
        })
      }
    })
  })
}

// Get device.
//
// sessionData     - The session information for the user, including the
//                   connection data for the remote system.
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
exports.getDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    try {
      var devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceDataKey(deviceId, 'devNwkId'))
    } catch (err) {
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
          dataAPI.addLog(network, 'Error on get device: ' + error)
          reject(error)
        } else {
          dataAPI.addLog(network, 'Error on get device (' + response.statusCode + '): ' + body.error)
          reject(response.statusCode)
        }
      } else {
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
exports.updateDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let device
    let devNetworkId
    let appNwkId
    let dpNwkId
    let dntl
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
    } catch (err) {
      dataAPI.addLog(network, 'Failed to get supporting data for updateDevice: ' + err)
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
          appLogger.log('Error on update device: ' + error)
          dataAPI.addLog(network, 'Error on update device: ' + error)
          reject(error)
        } else {
          appLogger.log('Error on update device (' + response.statusCode + '): ' + body.error)
          dataAPI.addLog(network, 'Error on update device (' + response.statusCode + '): ' + body.error)
          reject(response.statusCode)
        }
      } else {
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
              dataAPI.addLog(network, 'Error on update device keys: ' + error)
            } else {
              dataAPI.addLog(network, 'Error on update device keys (' + response.statusCode + '): ' + body.error)
            }
            resolve()
          } else {
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
exports.deleteDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    var devNetworkId
    try {
      devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceDataKey(deviceId, 'devNwkId'))
    } catch (err) {
      // Can't delete without the remote ID.
      dataAPI.addLog(network, "Failed to get remote network's device ID: " + err)
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
          dataAPI.addLog(network, 'Error on delete device: ' + error)
          reject(error)
        } else {
          dataAPI.addLog(network, 'Error on delete device (' + response.statusCode + '): ' + body.error)
          reject(response.statusCode)
        }
      } else {
        // Deleted device, network key is no longer valid.
        try {
          await dataAPI.deleteProtocolDataForKey(
            network.id,
            network.networkProtocolId,
            makeDeviceDataKey(deviceId, 'devNwkId'))
        } catch (err) {
          dataAPI.addLog(network, "Failed to delete remote network's device ID: " + err)
        }

        // Devices have a separate API for appkeys...
        options.url = network.baseUrl + '/devices/' + devNetworkId + '/keys'
        request(options, function (error, response, body) {
          if (error || response.statusCode >= 400) {
            if (error) {
              dataAPI.addLog(network, 'Error on delete device keys: ' + error)
            } else {
              dataAPI.addLog(network, 'Error on delete device keys (' + response.statusCode + '): ' + body.error)
            }
            resolve()
          } else {
            resolve()
          }
        })
        resolve()
      }
    })
  })
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
exports.pushDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Try a "get" to see if the device is already there.
    // eslint-disable-next-line no-unused-vars
    var d
    try {
      d = await exports.getDevice(sessionData, network, deviceId, dataAPI)
    } catch (err) {
      if (err === 404) {
        // Need to create, then.
        var did
        try {
          did = await exports.addDevice(sessionData, network, deviceId, dataAPI)
          resolve(did)
        } catch (err) {
          reject(err)
        }
        return
      }
      reject(err)
      return
    }

    // Get worked - do an update.
    try {
      await exports.updateDevice(sessionData, network, deviceId, dataAPI)
    } catch (err) {
      reject(err)
    }
    resolve()
  })
}

//* *****************************************************************************
// Companies & Device Profiles are not supported by TTN, the main LPWan user serves
// as a proxy for all user companies.
//* *****************************************************************************

exports.addCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('TheThingsNetwork: addCompany')
  appLogger.log('Companies are not supported by TTN')
  let error = new Error('Companies are not supported by TTN')
  dataAPI.addLog(network, 'Error on Add Companies: ' + error)
  return (error)
}

exports.getCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('TheThingsNetwork: getCompany')
  appLogger.log('Companies are not supported by TTN')
  let error = new Error('Companies are not supported by TTN')
  dataAPI.addLog(network, 'Error on Get Companies: ' + error)
  return (error)
}

exports.updateCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('TheThingsNetwork: updateCompany')
  appLogger.log('Companies are not supported by TTN')
  let error = new Error('Companies are not supported by TTN')
  dataAPI.addLog(network, 'Error on Update Companies: ' + error)
  return (error)
}

exports.deleteCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('TheThingsNetwork: deleteCompany')
  appLogger.log('Companies are not supported by TTN')
  let error = new Error('Companies are not supported by TTN')
  dataAPI.addLog(network, 'Error on Delete Companies: ' + error)
  return (error)
}

exports.pushCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('TheThingsNetwork: getCompany')
  appLogger.log('Companies are not supported by TTN')
  let error = new Error('Companies are not supported by TTN')
  dataAPI.addLog(network, 'Error on Get Companies: ' + error)
  return (error)
}

// TTN does not support companies.
exports.addRemoteCompany = function (sessionData, remoteOrganization, network, dataAPI, modelAPI) {
  appLogger.log('TheThingsNetwork: addRemoteCompany')
  appLogger.log('Companies are not supported by TTN')
  let error = new Error('Companies are not supported by TTN')
  dataAPI.addLog(network, 'Error on Add Remote Companies: ' + error)
  return (error)
}

exports.pullCompanies = function (sessionData, network, dataAPI, modelAPI) {
  appLogger.log('TheThingsNetwork: pullCompany')
  appLogger.log('Companies are not supported by TTN')
  let error = new Error('Companies are not supported by TTN')
  dataAPI.addLog(network, 'Error on Pull Companies: ' + error)
  return (error)
}

//* *****************************************************************************
// TTN Does not Support Device Profiles
//* *****************************************************************************

exports.addRemoteDeviceProfile = function (sessionData, limitedRemoteDeviceProfile, network, companyMap, dataAPI, modelAPI) {
  appLogger.log('TheThingsNetwork: addRemoteDeviceProfile')
  appLogger.log('Device Profiles are not supported by TTN')
  let error = new Error('Device Profiles are not supported by TTN')
  dataAPI.addLog(network, 'Error on addRemoteDeviceProfile: ' + error)
  return (error)
}

exports.pullDeviceProfiles = function (sessionData, network, companyMap, dataAPI, modelAPI) {
  appLogger.log('TheThingsNetwork: pullDeviceProfiles')
  appLogger.log('Device Profiles are not supported by TTN')
  let error = new Error('Device Profiles are not supported by TTN')
  dataAPI.addLog(network, 'Error on pullDeviceProfiles: ' + error)
  return (error)
}

exports.addDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('TheThingsNetwork: addDeviceProfile')
  appLogger.log('Device Profiles are not supported by TTN')
  let error = new Error('Device Profiles are not supported by TTN')
  dataAPI.addLog(network, 'Error on addDeviceProfile: ' + error)
  return (error)
}

exports.getDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('TheThingsNetwork: getDeviceProfile')
  appLogger.log('Device Profiles are not supported by TTN')
  let error = new Error('Device Profiles are not supported by TTN')
  dataAPI.addLog(network, 'Error on getDeviceProfile: ' + error)
  return (error)
}

exports.updateDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('TheThingsNetwork: updateDeviceProfile')
  appLogger.log('Device Profiles are not supported by TTN')
  let error = new Error('Device Profiles are not supported by TTN')
  dataAPI.addLog(network, 'Error on updateDeviceProfile: ' + error)
  return (error)
}

exports.deleteDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('TheThingsNetwork: deleteDeviceProfile')
  appLogger.log('Device Profiles are not supported by TTN')
  let error = new Error('Device Profiles are not supported by TTN')
  dataAPI.addLog(network, 'Error on deleteDeviceProfile: ' + error)
  return (error)
}

exports.pushDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('TheThingsNetwork: pushDeviceProfile')
  appLogger.log('Device Profiles are not supported by TTN')
  let error = new Error('Device Profiles are not supported by TTN')
  dataAPI.addLog(network, 'Error on pushDeviceProfile: ' + error)
  return (error)
}
