const request = require('request')
const nconf = require('nconf')
const appLogger = require('../lib/appLogger.js')

/**
 * The Things Network Protocol Handler Module
 * @module networkProtocols/The Things Network
 * @see module:networkProtocols/networkProtocols
 * @type {{activeApplicationNetworkProtocols: {}}}
 */
module.exports = {
  activeApplicationNetworkProtocols: {},
  metaData:
    {
      protocolHandlerName: 'TheThingsNetwork',
      networkType: 'Lora',
      oauthUrl: 'https://account.thethingsnetwork.org/users/authorize',
      protocolHandlerNetworkFields: [
        {
          name: 'clientId',
          description: 'The client id chosen when registering LPWan',
          help: '',
          type: 'string',
          label: 'Client ID',
          value: '',
          required: true,
          placeholder: 'your-things-client-id',
          oauthQueryParameter: ''
        },
        {
          name: 'clientSecret',
          description: 'The client secret provided when registering LPWan',
          help: '',
          type: 'string',
          label: 'Client Secret',
          value: '',
          required: true,
          placeholder: 'e.g. ZDTXlylatAHYPDBOXx...',
          oauthQueryParameter: ''
        },
        {
          name: 'code',
          desc: 'The accessCode returned after authorizing LPWan with TTN',
          help: '',
          type: 'readOnly',
          label: 'Access Code',
          value: '',
          required: false,
          placeholder: 'e.g. DWYDC9ALpFbKCNe...',
          oauthQueryParameter: 'code'
        }
      ],
      "oauthRequestUrlQueryParams": [
        {
          "name": "response_type",
          "valueSource": "value",
          "value": "code"
        },
        {
          "name": "cliend_id",
          "valueSource": "protocolHandlerNetworkField",
          "protocolHandlerNetworkField": "clientId"
        }
      ],
      "oauthResponseUrlQueryParams": [ "code" ],
      "oauthResponseUrlErrorParams": [ "error", "error_description" ]
    }
}

/**
 * Upon startup this function "registers" the protocol with the system.
 *
 * @param networkProtocols - Module to access the network protocols in the database
 * @returns {Promise<?>} - Empty promise means register worked
 */
module.exports.register = function (networkProtocols) {
  appLogger.log('TTN:register')
  return new Promise(async function (resolve, reject) {
    let me = {
      name: 'The Things Network',
      networkTypeId: 1,
      protocolHandler: 'TheThingsNetwork.js'
    }
    await networkProtocols.upsertNetworkProtocol(me)
    resolve()
  })
}

/**
 * @desc fetches the security information to access this The Things Network network on the companies behalf.
 *
 * @param {!Object} dataAPI - The API that handles common data access and manipulation functions
 *           on behalf of the protocol.
 * @param {!Object} network - The network that we are to get the company account info for.  For
 *           The Things Network, this is a lpwan The Things Network user account.
 * @returns {Promise<SecurityData>} - The Things Network account information
 */
module.exports.getCompanyAccessAccount = async function (dataAPI, network) {
  return getCompanyAccount(dataAPI, network, 1, false)
}

/**
 *
 * @desc The login account data needed to manipulate applications.  For The Things Network
 * Source, this is the company admin account.
 *
 * @param {!Object} dataAPI - The API that handles common data access and manipulation functions on behalf of the protocol.
 * @param {!Object} network - The network that we are to get the company account info for.  For
 *           The Things Network, this is a lpwan The Things Network user account.
 * @param {!String} applicationId -The id of the local application record
 * @returns {Promise<SecurityData>} - The Things Network account information
 */
module.exports.getApplicationAccessAccount = async function (dataAPI, network, applicationId) {
  let co = await dataAPI.getCompanyByApplicationId(applicationId)
  return getCompanyAccount(dataAPI, network, co.id, false)
}

/**
 *
 * @desc The login account data needed to manipulate devices.  For The Things Network
 * Source, this is the company admin account.
 *
 * @param {!Object} dataAPI - The API that handles common data access and manipulation functions on behalf of the protocol.
 * @param {!Object} network - The network that we are to get the company account info for.  For
 *           The Things Network, this is a lpwan The Things Network user account.
 * @param {!String} applicationId -The id of the local application record
 * @returns {Promise<SecurityData>} - The Things Network account information
 */
module.exports.getDeviceAccessAccount = async function (dataAPI, network, deviceId) {
  let co = await dataAPI.getCompanyByDeviceId(deviceId)
  return getCompanyAccount(dataAPI, network, co.id, false)
}

/**
 *
 * @desc The login account data needed to manipulate device profiles.  For The Things Network
 * Source, this is the company admin account.
 *
 * @param {!Object} dataAPI - The API that handles common data access and manipulation functions on behalf of the protocol.
 * @param {!Object} network - The network that we are to get the company account info for.  For
 *           The Things Network, this is a lpwan The Things Network user account.
 * @param {!String} applicationId -The id of the local application record
 * @returns {Promise<SecurityData>} - The Things Network account information
 */
module.exports.getDeviceProfileAccessAccount = async function (dataAPI, network, deviceId) {
  let co = await dataAPI.getCompanyByDeviceProfileId(deviceId)
  return getCompanyAccount(dataAPI, network, co.id, false)
}

/**
 * Connect with the remote The Things Network network
 * @param network - The networks record for the The Things Network network
 * @param loginData -
 * @returns {Promise<BearerToken>}
 */
module.exports.connect = function (network, loginData) {
  return new Promise(function (resolve, reject) {
    let options = {}
    if (loginData.refresh_token) {
      options.method = 'POST'
      options.url = network.baseUrl + '/users/token'
      let auth = Buffer.from(loginData.clientId + ':' + loginData.clientSecret).toString('base64')
      options.headers = { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth }
      options.json = {
        grant_type: 'refresh_token',
        refresh_token: loginData.refresh_token,
        redirect_url: 'https://mercury.schrimpsher.com:3200/api/oauth/callback'
      }
      console.log(options)
      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error on signin: ' + error)
          reject(error)
        } else if (response.statusCode >= 400) {
          appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
          reject(response.statusCode)
        } else {
          var token = body.access_token
          if (token) {
            resolve(token)
          } else {
            reject(new Error('No token'))
          }
        }
      })
    } else {
      reject(new Error('LPWan does not have credentials for TTN'))
    }
  })
}

/**
 * Disconnect to the remote The Things Network network
 * @param connection - ApiKey to the The Things Network connection
 *
 * @returns {Promise<?>} - Empty promise
 */
module.exports.disconnect = function (connection) {
  return new Promise(function (resolve, reject) {
    connection = null
    resolve()
  })
}

/**
 * @desc Fetches application and device data from the The Things Network Network
 *
 * @param sessionData - The session information for the user, including the
 *               connection data for the remote system.
 * @param network - The networks record for the network that uses this
 *               protocol.
 * @param companyId - The id for the local company data, for which the remote data
 *               will be retrieved.
 * @param dataAPI - Gives access to the data records and error tracking for the
 *               operation.
 *
 * @returns {Promise<?>} - Empty promise means remote records were loaded locally.
 */
module.exports.pullNetwork = function (sessionData, network, dataAPI, modelAPI) {
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

/**
 * Application CRUD Operations
 */

/**
 * @desc Fetches application data from the The Things Network Network
 *
 * @param sessionData - The session information for the user, including the
 *               connection data for the remote system.
 * @param network - The networks record for the network that uses this
 *               protocol.
 * @param companyMap
 * @param dpMap
 * @param dataAPI - Gives access to the data records and error tracking for the
 *               operation.
 * @param modelAPI
 *
 * @returns {Promise<?>} - Empty promise means remote records were loaded locally.
 */
module.exports.pullApplications = function (sessionData, network, companyMap, dpMap, dataAPI, modelAPI) {
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

/**
 * @desc Add a new application to the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id for the application to create on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<string>} - Remote (The Things Network) id of the new application
 */
module.exports.addApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let application
    try {
      // Get the local application data.
      application = await dataAPI.getApplicationById(applicationId)
    } catch (err) {
      dataAPI.addLog(network, 'Failed to get required data for addApplication: ' + err)
      reject(err)
      return
    }
    // Set up the request options.
    let options = {}
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

/**
 * @desc get an application from the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id to fetch from the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<Application>} - Remote application data
 */
module.exports.getApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId'))
    // Set up the request options.
    let options = {}
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

module.exports.getApplications = function (sessionData, network, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/applications'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + sessionData.connection
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    options.json = true

    request(options, function (error, response, body) {
      if (error) {
        dataAPI.addLog(network, 'Error on get application: ' + error)
        reject(error)
      } else {
        dataAPI.addLog(network, response.headers)
        dataAPI.addLog(network, body)
        resolve(body)
      }
    })
  })
}

/**
 * @desc Update an application on the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id for the application to update on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means application was updated on The Things Network network
 */
module.exports.updateApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the application data.
    let application = await dataAPI.getApplicationById(applicationId)
    let coNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeCompanyDataKey(application.companyId, 'coNwkId'))
    let appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId'))
    let applicationData = await dataAPI.getApplicationNetworkType(applicationId, network.networkTypeId)

    // Set up the request options.
    let options = {}
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

/**
 * @desc Delete an application to the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id for the application to delete on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means the application was deleted.
 */
module.exports.deleteApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Get the application data.
    let appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId'))
    // Set up the request options.
    let options = {}
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

/**
 * @desc Push the application to the The Things Network network. If it exists, update it.  If not create it.
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id for the application to create on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means application was pushed.
 */
module.exports.pushApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Try a "get" to see if the application is already there.
    // eslint-disable-next-line no-unused-vars
    let app
    try {
      app = await module.exports.getApplication(sessionData, network, applicationId, dataAPI)
    } catch (err) {
      if (err === 404) {
        // Need to create, then.
        let appid
        try {
          appid = await module.exports.addApplication(sessionData, network, applicationId, dataAPI)
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
      await module.exports.updateApplication(sessionData, network, applicationId, dataAPI)
    } catch (err) {
      reject(err)
    }
    resolve()
  })
}

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
  return new Promise(async function (resolve, reject) {
    try {
      // Create a new endpoint to get POSTs, and call the deliveryFunc.
      // Use the local applicationId and the networkId to create a unique
      // URL.
      let deliveryURL = 'api/ingest/' + applicationId + '/' + network.id
      let reportingAPI = await dataAPI.getReportingAPIByApplicationId(applicationId)

      // Link the reporting API to the application and network.
      this.activeApplicationNetworkProtocols['' + applicationId + ':' + network.id] = reportingAPI

      // Set up the Forwarding with LoRa App Server
      let appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeApplicationDataKey(applicationId, 'appNwkId'))
      let options = {}
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
module.exports.stopApplication = function (sessionData, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let appNwkId
    // Can't delete if not running on the network.
    if (this.activeApplicationNetworkProtocols['' + applicationId + ':' + network.id] === undefined) {
      // We don't think the app is running on this network.
      dataAPI.addLog(network, 'Application ' + applicationId +
        ' is not running on network ' + network.id)
      reject(new Error('Application ' + applicationId +
        ' is not running on network ' + network.id))
    }

    try {
      appNwkId = await dataAPI.getProtocolDataForKey(
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
    let options = {}
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
        delete this.activeApplicationNetworkProtocols['' + applicationId + ':' + network.id]

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
    let reportingAPI = this.activeApplicationNetworkProtocols['' + applicationId + ':' + network.id]

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
      let deviceId
      if (data.devEUI) {
        let recs = await dataAPI.getProtocolDataWithData(
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

/**
 * Device CRUD Operations
 */

/**
 * @desc Fetches device data from the The Things Network Network
 *
 * @param sessionData - The session information for the user, including the
 *               connection data for the remote system.
 * @param network - The networks record for the network that uses this
 *               protocol.
 * @param companyId - The id for the local company data, for which the remote data
 *               will be retrieved.
 * @param dpMap
 * @param remoteApplicationId
 * @param applicationId
 * @param dataAPI - Gives access to the data records and error tracking for the
 *               operation.
 * @param modelAPI
 *
 * @returns {Promise<?>} - Empty promise means remote records were loaded locally.
 */
module.exports.pullDevices = function (sessionData, network, companyId, dpMap, remoteApplicationId, applicationId, dataAPI, modelAPI) {
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

/**
 * @desc Add a new device to the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param deviceId - The device id for the device to create on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<string>} - Remote (The Things Network) id of the new device
 */
module.exports.addDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let device
    let dntl
    let devpro
    let appNwkId
    let dpNwkId
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
    let options = {}
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
    let devNS = dntl.networkSettings

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

/**
 * @desc get a device from the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param deviceId - The device id to fetch from the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<Application>} - Remote device data
 */
module.exports.getDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    try {
      let devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeDeviceDataKey(deviceId, 'devNwkId'))
      // Set up the request options.
      let options = {}
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
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * @desc Update a device on the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The device id for the device to update on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means device was updated on The Things Network network
 */
module.exports.updateDevice = function (sessionData, network, deviceId, dataAPI) {
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
    let options = {}
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

/**
 * @desc Delete a device to the The Things Network network
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The device id for the device to delete on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means the device was deleted.
 */
module.exports.deleteDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let devNetworkId
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
    let options = {}
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

/**
 * @desc Push the device to the The Things Network network. If it exists, update it.  If not create it.
 *
 * @param sessionData - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The device id for the device to create on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means device was pushed.
 */
module.exports.pushDevice = function (sessionData, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    // Try a "get" to see if the device is already there.
    // eslint-disable-next-line no-unused-lets,no-unused-vars
    let d
    try {
      d = await module.exports.getDevice(sessionData, network, deviceId, dataAPI)
    } catch (err) {
      if (err === 404) {
        // Need to create, then.
        let did
        try {
          did = await module.exports.addDevice(sessionData, network, deviceId, dataAPI)
          resolve(did)
        } catch (err) {
          reject(err)
        }
      }
      reject(err)
    }

    // Get worked - do an update.
    try {
      await module.exports.updateDevice(sessionData, network, deviceId, dataAPI)
    } catch (err) {
      reject(err)
    }
    resolve()
  })
}

//* *****************************************************************************
// Companies & Device Profiles are not supported by The Things Network, the main LPWan user serves
// as a proxy for all user companies.
//* *****************************************************************************

/**
 * Companies are not supported by The Things Network
 *
 * @param sessionData
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.addCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('The Things Network: addCompany')
  appLogger.log('Companies are not supported by The Things Network')
  let error = new Error('Companies are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on Add Companies: ' + error)
  return (error)
}

/**
 * Companies are not supported by The Things Network
 *
 * @param sessionData
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.getCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('The Things Network: getCompany')
  appLogger.log('Companies are not supported by The Things Network')
  let error = new Error('Companies are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on Get Companies: ' + error)
  return (error)
}

/**
 * Companies are not supported by The Things Network
 *
 * @param sessionData
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.updateCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('The Things Network: updateCompany')
  appLogger.log('Companies are not supported by The Things Network')
  let error = new Error('Companies are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on Update Companies: ' + error)
  return (error)
}

/**
 * Companies are not supported by The Things Network
 *
 * @param sessionData
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.deleteCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('The Things Network: deleteCompany')
  appLogger.log('Companies are not supported by The Things Network')
  let error = new Error('Companies are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on Delete Companies: ' + error)
  return (error)
}

/**
 * Companies are not supported by The Things Network
 *
 * @param sessionData
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.pushCompany = function (sessionData, network, companyId, dataAPI) {
  appLogger.log('The Things Network: getCompany')
  appLogger.log('Companies are not supported by The Things Network')
  let error = new Error('Companies are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on Get Companies: ' + error)
  return (error)
}

/**
 * Companies are not supported by The Things Network
 *
 * @param sessionData
 * @param remoteOrganization
 * @param network
 * @param dataAPI
 * @returns {Error}
 */
module.exports.addRemoteCompany = function (sessionData, remoteOrganization, network, dataAPI, modelAPI) {
  appLogger.log('The Things Network: addRemoteCompany')
  appLogger.log('Companies are not supported by The Things Network')
  let error = new Error('Companies are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on Add Remote Companies: ' + error)
  return (error)
}

/**
 * Companies are not supported by The Things Network
 *
 * @param sessionData
 * @param network
 * @param dataAPI
 * @param modelAPI
 * @returns {Error}
 */
module.exports.pullCompanies = function (sessionData, network, dataAPI, modelAPI) {
  appLogger.log('The Things Network: pullCompany')
  appLogger.log('Companies are not supported by The Things Network')
  let error = new Error('Companies are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on Pull Companies: ' + error)
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 *
 * @param sessionData
 * @param limitedRemoteDeviceProfile
 * @param network
 * @param companyMap
 * @param dataAPI
 * @param modelAPI
 * @returns {Error}
 */
module.exports.addRemoteDeviceProfile = function (sessionData, limitedRemoteDeviceProfile, network, companyMap, dataAPI, modelAPI) {
  appLogger.log('The Things Network: addRemoteDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on addRemoteDeviceProfile: ' + error)
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param sessionData
 * @param network
 * @param companyMap
 * @param dataAPI
 * @param modelAPI
 * @returns {Error}
 */
module.exports.pullDeviceProfiles = function (sessionData, network, companyMap, dataAPI, modelAPI) {
  appLogger.log('The Things Network: pullDeviceProfiles')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on pullDeviceProfiles: ' + error)
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 *
 * @param sessionData
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.addDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: addDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on addDeviceProfile: ' + error)
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param sessionData
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.getDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: getDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on getDeviceProfile: ' + error)
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param sessionData
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.updateDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: updateDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on updateDeviceProfile: ' + error)
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param sessionData
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.deleteDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: deleteDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on deleteDeviceProfile: ' + error)
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param sessionData
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.pushDeviceProfile = function (sessionData, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: pushDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  dataAPI.addLog(network, 'Error on pushDeviceProfile: ' + error)
  return (error)
}

/**
 * Private Utilities
 */

/**
 * @desc Fetch the authentication key to the LPWan The Things Network account.
 *
 * @access private
 *
 * @param {!Object} dataAPI - The API that handles common data access and manipulation functions on behalf of the protocol.
 * @param {!Object} network - The network that we are to get the company account info for.  For
 *           The Things Network, this is a LPWan The Things Network key.
 * @param {!string} companyId - The id of the company access is requested for.
 * @param {!boolean} generateIfMissing - No used in The Things Network
 * @returns {?SecurityData}
 */
function getCompanyAccount (dataAPI, network, companyId, generateIfMissing) {
  let secData = network.securityData
  if (!secData || (!secData.access_token && !secData.refresh_token)) {
    appLogger.log('Network security data is incomplete for ' + network.name)
    dataAPI.addLog(network, 'Network security data is incomplete for ' + network.name)
    return null
  }
  return secData
}

/**
 * @access private
 *
 * @param companyId
 * @param dataName
 * @returns {string}
 */
function makeCompanyDataKey (companyId, dataName) {
  return 'co:' + companyId + '/' + dataName
}

/**
 * @access private
 *
 * @param applicationId
 * @param dataName
 * @returns {string}
 */
function makeApplicationDataKey (applicationId, dataName) {
  return 'app:' + applicationId + '/' + dataName
}

/**
 * @access private
 *
 * @param deviceId
 * @param dataName
 * @returns {string}
 */
function makeDeviceDataKey (deviceId, dataName) {
  return 'dev:' + deviceId + '/' + dataName
}

/**
 * @access private
 *
 * @param deviceProfileId
 * @param dataName
 * @returns {string}
 */
function makeDeviceProfileDataKey (deviceProfileId, dataName) {
  return 'dp:' + deviceProfileId + '/' + dataName
}

/**
 * @access private
 *
 * @param network
 * @param deviceId
 * @param connection
 * @param dataAPI
 * @returns {Promise<Device>}
 */
function getDeviceById (network, deviceId, connection, dataAPI) {
  appLogger.log('The Things Network: getDeviceById')
  return new Promise(async function (resolve, reject) {
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
    request(options, async function (error, response, body) {
      if (error) {
        dataAPI.addLog(network, 'Error on get Device: ' + error)
        reject(error)
      } else if (response.statusCode >= 400) {
        let bodyObj = JSON.parse(response.body)
        dataAPI.addLog(network, 'Error on get Device: ' +
          bodyObj.error +
          ' (' + response.statusCode + ')')
        dataAPI.addLog(network, 'Request data = ' + JSON.stringify(options))
        reject(response.statusCode)
      } else {
        let res = JSON.parse(body)
        appLogger.log(res)
        resolve(res)
      }
    })
  })
};

/**
 * @access private
 *
 * @param network
 * @param deviceId
 * @param connection
 * @param dataAPI
 * @returns {Promise<Application>}
 */
function getApplicationById (network, applicationId, connection, dataAPI) {
  appLogger.log('The Things Network: getApplicationById')
  return new Promise(async function (resolve, reject) {
    let options = {}
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

    request(options, async function (error, response, body) {
      if (error) {
        dataAPI.addLog(network, 'Error on get Application: ' + error)
        reject(error)
      } else if (response.statusCode >= 400) {
        let bodyObj = JSON.parse(response.body)
        dataAPI.addLog(network, 'Error on get Application: ' +
          bodyObj.error +
          ' (' + response.statusCode + ')')
        dataAPI.addLog(network, 'Request data = ' + JSON.stringify(options))
        reject(response.statusCode)
      } else {
        let res = JSON.parse(body)
        appLogger.log(res)
        resolve(res)
      }
    })
  })
}

/**
 * @desc Adds or updates a local application based on what is fetched from the network application manager.
 *
 * @access private
 *
 * @param sessionData
 * @param limitedRemoteApplication
 * @param network
 * @param companyMap
 * @param dpMap
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<string>} - Local application id
 */
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

/**
 * @desc Adds or updates a local device based on what is fetched from the network application manager.
 *
 * @access private
 *
 * @param sessionData
 * @param limitedRemoteApplication
 * @param network
 * @param companyMap
 * @param dpMap
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<string>} - Local application id
 */
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
