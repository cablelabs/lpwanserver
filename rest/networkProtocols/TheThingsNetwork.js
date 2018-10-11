const request = require('request')
const nconf = require('nconf')
const appLogger = require('../lib/appLogger.js')
const uuid = require('uuid/v1')

/**********************************************************************************************************************
 * Bookeeping: Register, Test, Connect
 *********************************************************************************************************************/

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
      version:
        {
          versionText: 'Version 2.0',
          versionValue: '2.0'
        },
      networkType: 'Lora',
      oauthUrl: 'https://account.thethingsnetwork.org/users/authorize',
      protocolHandlerNetworkFields: [
        {
          name: 'clientId',
          description: 'The client id chosen when registering the LPWan',
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
          description: 'The client secret provided when registering the LPWan',
          help: '',
          type: 'string',
          label: 'Client Secret',
          value: '',
          required: true,
          placeholder: 'e.g. ZDTXlylatAHYPDBOXx...',
          oauthQueryParameter: ''
        },
        {
          name: 'username',
          description: 'The username of the TTN admin account',
          help: '',
          type: 'string',
          label: 'Username',
          value: '',
          required: false,
          placeholder: 'myTTNUsername',
          oauthQueryParameter: ''
        },
        {
          name: 'password',
          description: 'The password of the TTN admin account',
          help: '',
          type: 'password',
          label: 'Password',
          value: '',
          required: false,
          placeholder: 'myTTNPassword',
          oauthQueryParameter: ''
        }
      ],
      oauthRequestUrlQueryParams: [
        {
          name: 'response_type',
          valueSource: 'value',
          value: 'code'
        },
        {
          name: 'client_id',
          valueSource: 'protocolHandlerNetworkField',
          protocolHandlerNetworkField: 'clientId'
        },
        {
          name: 'redirect_uri',
          valueSource: 'frontEndOauthReturnUri'
        }
      ],
      oauthResponseUrlQueryParams: [ 'code' ],
      oauthResponseUrlErrorParams: [ 'error', 'error_description' ]
    }
}

/**
 * Upon startup this function "registers" the protocol with the system.
 *
 * @param networkProtocols - Module to access the network protocols in the database
 * @returns {Promise<?>} - Empty promise means register worked
 */
module.exports.register = function (networkProtocols) {
  appLogger.log('TTN:register', 'info')
  return new Promise(async function (resolve, reject) {
    let me = {
      name: 'The Things Network',
      networkTypeId: 1,
      protocolHandler: 'TheThingsNetwork.js',
      networkProtocolVersion: '2.0'
    }
    await networkProtocols.upsertNetworkProtocol(me)
    resolve()
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
  let me = this
  return new Promise(function (resolve, reject) {
    appLogger.log(network.securityData, 'debug')
    if (network.securityData.authorized) {
      let options = {}
      options.method = 'GET'
      options.url = network.baseUrl + '/api/v2/applications'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + network.securityData.access_token
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      options.json = true
      appLogger.log(options, 'info')
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
          appLogger.log('Test Error: ' + error)
          if (response && response.statusCode) {
            appLogger.log(response.statusCode)
          }
          reject(error)
        }
      })
    }
    else {
      reject(new Error('Not Authorized'))
    }
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

function authorizeWithPassword (network, loginData, scope) {
  return new Promise(function (resolve, reject) {
    let options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/users/token'
    let auth = Buffer.from(loginData.clientId + ':' + loginData.clientSecret).toString('base64')
    options.headers = {'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth}
    options.json = {
      grant_type: 'password',
      username: loginData.username,
      password: loginData.password,
      scope: ['apps', 'gateways', 'components', 'apps:cable-labs-prototype']
    }
    if (scope && scope.length > 0) {
      options.json.scope = scope
    }
    appLogger.log(options)
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on signin: ' + error)
        reject(error)
      }
      else if (response.statusCode >= 400 || response.statusCode === 301) {
        appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
        reject(response.statusCode)
      }
      else {
        appLogger.log(body, 'debug')
        resolve(body)
      }
    })
  })
}

function authorizeWithCode (network, loginData) {
  return new Promise(function (resolve, reject) {
    let options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/users/token'
    let auth = Buffer.from(loginData.clientId + ':' + loginData.clientSecret).toString('base64')
    options.headers = {'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth}
    options.json = {
      grant_type: 'authorization_code',
      code: loginData.code,
      redirect_url: 'http://localhost:3000/admin/networks/oauth'
    }
    appLogger.log(options)
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on signin: ' + error)
        reject(error)
      }
      else if (response.statusCode >= 400 || response.statusCode === 301) {
        appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
        reject(response.statusCode)
      }
      else {
        appLogger.log(body)
        var token = body.access_token
        if (token) {
          resolve(body)
        }
        else {
          reject(new Error('No token'))
        }
      }
    })
  })
}

function authorizeWithRefreshToken (network, loginData) {
  return new Promise(function (resolve, reject) {
    let options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/users/token'
    let auth = Buffer.from(loginData.clientId + ':' + loginData.clientSecret).toString('base64')
    options.headers = {'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth}
    options.json = {
      grant_type: 'refresh_token',
      refresh_token: loginData.refresh_token,
      redirect_url: loginData.redirect_uri
    }
    appLogger.log(options)
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on signin: ' + error)
        reject(error)
      }
      else if (response.statusCode >= 400) {
        appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
        reject(response.statusCode)
      }
      else {
        appLogger.log(body)
        var token = body.access_token
        body.username = 'TTNUser'
        if (token) {
          resolve(body)
        }
        else {
          reject(new Error('No token'))
        }
      }
    })
  })
}

/**
 * Connect with the remote The Things Network network
 * @param network - The networks record for the The Things Network network
 * @param loginData -
 * @returns {Promise<BearerToken>}
 */
module.exports.connect = async function connect (network, loginData) {
  appLogger.log('Inside TTN connect ' + JSON.stringify(loginData))
  if (network.securityData.authorized) {
    appLogger.log('Should be authorized')
    try {
      await this.test(network, loginData)
      return loginData
    } catch (err) {
      appLogger.log('Authorized but test failed.  Attempting to login.')
    }
  }
  if (loginData.refresh_token) {
    return authorizeWithRefreshToken(network, loginData)
  }
  if (loginData.username && loginData.password) {
    return authorizeWithPassword(network, loginData)
  }
  if (loginData.code) {
    return authorizeWithCode(network, loginData)
  }
  const error = new Error('LPWan does not have credentials for TTN')
  error.code = 42
  throw error
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

function getOptions (method, url, type, resource, access_token) {
  let middle = ''
  let authorization = ''
  if (type === 'account') {
    middle = '/api/v2'
    authorization = 'Bearer ' + access_token
  }
  else if (type == 'console') {
    middle = '/api'
    authorization = 'Bearer ' + access_token
  }
  else {
    authorization = 'Bearer ' + access_token
  }
  let options = {}
  options.method = method
  options.url = url + middle + '/' + resource
  options.headers = {
    'Content-Type': 'application/json',
    'Authorization': authorization
  }
  options.agentOptions = {
    'secureProtocol': 'TLSv1_2_method',
    'rejectUnauthorized': false
  }
  return options
}

/**********************************************************************************************************************
 * Synch Operations: Pull, Push, AddRemote*, Normalize*
 *********************************************************************************************************************/

/**
 * Pull remote resources on TTN v2.0 Server
 *
 * @param session - authentication
 * @param network - network information
 * @param dataAPI - id mappings
 * @param modelAPI - DB access
 * @returns {Promise<Empty>}
 */
module.exports.pullNetwork = async function pullNetwork(session, network, dataAPI, modelAPI) {
  let promiseList = [this.pullApplications(session, network, modelAPI, dataAPI)]
  try {
    const pulledResources = await Promise.all(promiseList)
    appLogger.log(pulledResources, 'info')
    let devicePromistList = []
    for (let index in pulledResources[0]) {
      devicePromistList.push(this.pullDevices(session, network, pulledResources[0][index].remoteApplication, pulledResources[0][index].localApplication, {}, modelAPI, dataAPI))
      // devicePromistList.push(this.pullIntegrations(session, network, pulledResources[1][index].remoteApplication, pulledResources[1][index].localApplication, pulledResources[0], modelAPI, dataAPI))
    }
    const devices = await Promise.all(devicePromistList)
    appLogger.log(devices, 'info')
    appLogger.log('Success Pulling Network ' + network.name, 'info')
  } catch (err) {
    appLogger.log(err, 'error')
    throw err
  }
}

/**
 * Pull remote applications on TTN V1.
 * 1. Pulls application on TTN Account Server
 * 2. Pulls specific application from US-West Handler
 *
 * @param session
 * @param network
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<Array[Remote to Local Application Id Mapping]>}
 */
module.exports.pullApplications = function (session, network, modelAPI, dataAPI) {
  return new Promise(async function (resolve, reject) {
    if (session && session.connection && session.connection.access_token) {
      let options = getOptions('GET', 'https://console.thethingsnetwork.org', 'console', 'applications', session.connection.access_token)
      appLogger.log(options, 'info')
      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error pulling applications from network ' + network.name + ': ' + error)
          reject(error)
        }
        else {
          let apps = JSON.parse(body)
          appLogger.log(apps, 'info')
          let promiseList = []
          if (!network.securityData.appKeys) network.securityData.appKeys = []
          for (let index in apps) {
            let app = apps[index]
            network.securityData.appKeys.push({app: app.id, key: app.access_keys[0].key})
            promiseList.push(addRemoteApplication(session, app, network, modelAPI, dataAPI))
          }
          Promise.all(promiseList)
            .then((apps) => {
              resolve(apps)
            })
            .catch(err => {
              appLogger.log(err, 'error')
              reject(err)
            })
        }
      })
    }
    else {
      reject(new Error('Network ' + network.name + ' is not authorized'))
    }
  })
}

function addRemoteApplication (session, limitedRemoteApplication, network, modelAPI, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    try {
      let remoteApplication = await getApplicationById(network, limitedRemoteApplication.id, session.connection)
      remoteApplication = JSON.parse(remoteApplication)
      let normalizedApplication = normalizeApplicationData(remoteApplication, limitedRemoteApplication, network)
      let existingApplication = await modelAPI.applications.retrieveApplications({search: normalizedApplication.name})
      if (existingApplication.totalCount > 0) {
        existingApplication = existingApplication.records[0]
        appLogger.log(existingApplication.name + ' already exists', 'info')
        appLogger.log(normalizedApplication, 'info')
      }
      else {
        existingApplication = await modelAPI.applications.createApplication(normalizedApplication.name, normalizedApplication.description, 2, network.networkTypeId, 'http://set.me.to.your.real.url:8888')
        appLogger.log('Created ' + existingApplication.name)
      }

      let existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({applicationId: existingApplication.id})
      if (existingApplicationNTL.totalCount > 0) {
        appLogger.log(existingApplication.name + ' link already exists', 'info')
      }
      else {
        existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.createRemoteApplicationNetworkTypeLink(existingApplication.id, network.networkTypeId, normalizedApplication, existingApplication.companyId)
        appLogger.log(existingApplicationNTL, 'info')
        let temp = await dataAPI.putProtocolDataForKey(network.id,
          network.networkProtocolId,
          makeApplicationDataKey(existingApplication.id, 'appNwkId'),
          normalizedApplication.id)
      }
      resolve({localApplication: existingApplication.id, remoteApplication: normalizedApplication.id})
    }
    catch (err) {
      appLogger.log(err, 'error')
      reject(err)
    }
  })
}

// Get the NetworkServer using the Service Profile a ServiceProfile.
function getApplicationById (network, remoteApplicationId, connection) {
  appLogger.log('LoRaOpenSource: getApplicationById', 'debug')
  return new Promise(async function (resolve, reject) {
    let options = getOptions('GET', 'http://us-west.thethings.network:8084', 'handler', 'applications/' + remoteApplicationId, connection.access_token)
    appLogger.log(options, 'info')
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Application: ' + error)
          reject(error)
        }
        else {
          appLogger.log(body)
          appLogger.log('Error on get Application: ' +
            body.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        appLogger.log(body, 'debug')
        let application = {}
        if (typeof body === 'object') {
          application = body
        }
        else {
          application = JSON.parse(response.body)
        }
        resolve(body)
      }
    })
  })
}

/**
 * Pull remote devices from a TTN server
 * @param session
 * @param network
 * @param companyId
 * @param dpMap
 * @param remoteApplicationId
 * @param applicationId
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<any>}
 */
module.exports.pullDevices = function (session, network, remoteApplicationId, localApplicationId, dpMap, modelAPI, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = 'http://us-west.thethings.network:8084/applications/' + remoteApplicationId + '/devices'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.connection.access_token
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    appLogger.log(options, 'info')
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error pulling devices from network ' + network.name, 'error')
        appLogger.log(error, 'error')
        reject(error)
      }
      else {
        appLogger.log(body, 'info')
        let devices = {}
        if (typeof body === 'object') {
          devices = body.devices
        }
        else {
          devices = JSON.parse(response.body).devices
        }
        appLogger.log()
        let promiseList = []
        for (let index in devices) {
          let device = devices[index]
          promiseList.push(addRemoteDevice(session, device, network, localApplicationId, dpMap, modelAPI, dataAPI))
        }
        Promise.all(promiseList)
          .then((devices) => {
            resolve(devices)
          })
          .catch(err => {
            appLogger.log(err, 'error')
            reject(err)
          })
      }
    })
  })
}

function addRemoteDevice (session, remoteDevice, network, applicationId, dpMap, modelAPI, dataAPI) {
  return new Promise(async function (resolve, reject) {
    appLogger.log('Adding ' + remoteDevice.deveui)
    appLogger.log(remoteDevice)
    let existingDevice = await modelAPI.devices.retrieveDevices({search: remoteDevice.lorawan_device.dev_eui})

    appLogger.log(existingDevice)
    if (existingDevice.totalCount > 0) {
      existingDevice = existingDevice.records[0]
      appLogger.log(existingDevice.name + ' already exists')
    }
    else {
      appLogger.log('creating ' + remoteDevice.lorawan_device.dev_eui)
      existingDevice = await modelAPI.devices.createDevice(remoteDevice.lorawan_device.dev_eui, remoteDevice.description, applicationId)
      appLogger.log('Created ' + existingDevice.name)
    }

    let existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({deviceId: existingDevice.id})
    let existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLink(applicationId)

    if (existingDeviceNTL.totalCount > 0) {
      appLogger.log(existingDevice.name + ' link already exists')
      resolve({localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id})
    }
    else {
      appLogger.log('creating Network Link for ' + existingDevice.name)
      addRemoteDeviceProfile(session, remoteDevice, existingApplicationNTL, network, modelAPI, dataAPI)
        .then(dp => {
          appLogger.log(dp, 'info')
          let normalizedDevice = normalizeDeviceData(remoteDevice, dp.localDeviceProfile)
          appLogger.log(normalizedDevice)
          modelAPI.deviceNetworkTypeLinks.createRemoteDeviceNetworkTypeLink(existingDevice.id, network.networkTypeId, dp.localDeviceProfile, normalizedDevice, 2)
            .then(existingDeviceNTL => {
              appLogger.log(existingDeviceNTL)
              dataAPI.putProtocolDataForKey(network.id,
                network.networkProtocolId,
                makeDeviceDataKey(existingDevice.id, 'devNwkId'),
                remoteDevice.dev_id)
              appLogger.log({localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id})
              resolve({localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id})
            })
            .catch(err => {
              appLogger.log(err, 'error')
              reject(err)
            })
        })
        .catch(err => {
          appLogger.log(err, 'error')
          reject(err)
        })
    }
  })
}

function addRemoteDeviceProfile (session, remoteDevice, application, network, modelAPI, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let networkSpecificDeviceProfileInformation = normalizeDeviceProfileData(remoteDevice, application)
    appLogger.log(networkSpecificDeviceProfileInformation, 'error')
    modelAPI.deviceProfiles.createRemoteDeviceProfile(network.networkTypeId, 2,
      networkSpecificDeviceProfileInformation.name, 'Device Profile managed by LPWAN Server, perform changes via LPWAN',
      networkSpecificDeviceProfileInformation)
      .then((existingDeviceProfile) => {
        resolve({
          localDeviceProfile: existingDeviceProfile.id,
          remoteDeviceProfile: existingDeviceProfile.id
        })
      })
      .catch((error) => {
        appLogger.log(error)
        reject(error)
      })
  })
}

/**
 * Push all information out to the network server
 *
 * @param session
 * @param network
 * @param dataAPI
 * @param modelAPI
 * @returns {Promise<any>}
 */
module.exports.pushNetwork = function (session, network, dataAPI, modelAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let promiseList = []
    promiseList.push(me.pushApplications(session, network, dataAPI, modelAPI))
    Promise.all(promiseList)
      .then(pushedResources => {
        let devicePromiseList = []
        devicePromiseList.push(me.pushDevices(session, network, dataAPI, modelAPI))
        Promise.all(devicePromiseList)
          .then(pushedResource => {
            appLogger.log('Success Pushing Network ' + network.name, 'info')
            appLogger.log(pushedResource, 'info')
            resolve()
          })
          .catch(err => {
            appLogger.log(err, 'error')
            reject(err)
          })
      })
      .catch(err => {
        appLogger.log(err, 'error')
        reject(err)
      })
  })
}

module.exports.pushApplications = function (session, network, dataAPI, modelAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let existingApplications = await modelAPI.applications.retrieveApplications()
    appLogger.log(existingApplications, 'info')
    let promiseList = []
    for (let index = 0; index < existingApplications.records.length; index++) {
      promiseList.push(me.pushApplication(session, network, existingApplications.records[index], dataAPI, modelAPI))
    }
    Promise.all(promiseList)
      .then(pushedResources => {
        appLogger.log('Success Pushing Applications', 'info')
        appLogger.log(pushedResources, 'info')
        resolve(pushedResources)
      })
      .catch(err => {
        appLogger.log(err, 'error')
        reject(err)
      })
  })
}

module.exports.pushApplication = function (session, network, application, dataAPI, modelAPI ) {
  let me = this
  return new Promise(async function (resolve, reject) {
    appLogger.log(application, 'error')
    // See if it already exists
    dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(application.id, 'appNwkId'))
      .then(appNetworkId => {
        if (appNetworkId) {
          appLogger.log('Ignoring Application  ' + application.id + ' already on network ' + network.name + ' as ' + appNetworkId, 'info')
          resolve({localApplication: application.id, remoteApplication: appNetworkId})
        }
        else {
          reject(new Error('Bad things in the Protocol Table'))
        }
      })
      .catch(() => {
        appLogger.log('Pushing Application ' + application.name, 'info')
        me.addApplication(session, network, application.id, dataAPI, modelAPI)
          .then((appNetworkId) => {
            appLogger.log('Added application ' + application.id + ' to network ' + network.name, 'info')
            resolve({localApplication: application.id, remoteApplication: appNetworkId})
          })
          .catch(err => {
            appLogger.log(err, 'error')
            reject(err)
          })
      })
  })
}

module.exports.pushDevices = function (sessionData, network, dataAPI, modelAPI) {
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
        appLogger.log(err, 'error')
        reject(err)
      })
  })
}

module.exports.pushDevice = function (sessionData, network, device, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceDataKey(device.id, 'devNwkId'))
      .then(devNetworkId => {
        appLogger.log('Ignoring Device  ' + device.id + ' already on network ' + network.name, 'info')
        if (devNetworkId) {
          resolve({localDevice: device.id, remoteDevice: devNetworkId})
        }
        else {
          appLogger.log(devNetworkId + ' found for network ' + network.name + ' for device ' + device.id, 'info')
          reject(new Error('Something bad happened with the Protocol Table'))
        }
      })
      .catch(() => {
        appLogger.log('Adding Device  ' + device.id + ' to network ' + network.name, 'info')

        me.addDevice(sessionData, network, device.id, dataAPI)
          .then((devNetworkId) => {
            appLogger.log('Added Device  ' + device.id + ' to network ' + network.name, 'info')
            resolve({localDevice: device.id, remoteDevice: devNetworkId})
          })
          .catch(err => {
            appLogger.log(err, 'error')
            reject(err)
          })
      })
  })
}

/**
 * @desc Add a new application to the The Things Network network
 *
 * @param session - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id for the application to create on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<string>} - Remote (The Things Network) id of the new application
 */
module.exports.addApplication = function (session, network, applicationId, dataAPI, modelAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let application
    let applicationData
    try {
      // Get the local application data.
      application = await dataAPI.getApplicationById(applicationId)
      applicationData = await dataAPI.getApplicationNetworkType(applicationId, network.networkTypeId)
    }
    catch (err) {
      appLogger.log('Failed to get required data for addApplication: ' + applicationId, 'error')
      reject(err)
      return
    }
    // Set up the request options.
    let options = {}
    options.method = 'POST'
    options.url = network.baseUrl + '/applications'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.connection.access_token
    }
    let ttnApplication = deNormalizeApplicationData(applicationData.networkSettings)
    options.json = ttnApplication.ttnApplicationMeta
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    appLogger.log(options)
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on create application: ' + error, 'error')
          appLogger.log(error, 'error')
          reject(error)
        }
        else {
          let error = new Error('Error on create application: ' + '(' + response.statusCode + ')')
          appLogger.log(error, 'error')
          appLogger.log(body, 'error')
          reject(response.statusCode)
        }
      }
      else {
        try {
          appLogger.log(body, 'info')
          let response = {}
          if (typeof body === 'object') {
            response = body
          }
          else {
            resonse = JSON.parse(response.body)
          }

          applicationData.networkSettings.applicationEUI = response.euis[0]
          appLogger.log(applicationData, 'error')
          await modelAPI.applicationNetworkTypeLinks.updateRemoteApplicationNetworkTypeLink(applicationData, 2)

          await dataAPI.putProtocolDataForKey(network.id,
            network.networkProtocolId,
            makeApplicationDataKey(application.id, 'appNwkId'),
            body.id)

          scope = ['apps', 'gateways', 'components', 'apps:' + body.id]
          session.connection = await authorizeWithPassword(network, network.securityData, scope)
          me.registerApplicationWithHandler(session.connection.access_token, network, ttnApplication.ttnApplicationData, body, dataAPI)
            .then(id => {
              resolve(id)
            })
            .catch(err => {
              appLogger.log(err, 'error')
              reject(err)
            })
        }
        catch (err) {
          reject(err)
        }
      }
    })
  })
}

module.exports.registerApplicationWithHandler = function (appToken, network, ttnApplication, ttnApplicationMeta, dataAPI) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let options = getOptions('POST', 'http://us-west.thethings.network:8084', 'handler', 'applications', appToken)
    options.json = {app_id: ttnApplication.app_id}
    appLogger.log(options)
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on register Application: ', 'error')
          reject(error)
        }
        else {
          appLogger.log(body)
          appLogger.log('Error on get Application: ' +
            bodyObj.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        appLogger.log(body)
        me.setApplication(appToken, network, ttnApplication, ttnApplicationMeta, dataAPI)
          .then(id => {
            resolve(id)
          })
          .catch(err => {
            appLogger.log(err, 'error')
            reject(err)
          })
      }
    })
  })
}

module.exports.setApplication = function (appToken, network, ttnApplication, ttnApplicationMeta, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let options = getOptions('PUT', 'http://us-west.thethings.network:8084', 'handler', 'applications/' + ttnApplicationMeta.id, appToken)
    options.json = ttnApplication
    appLogger.log(options)
    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on get Application: ', 'error')
          reject(error)
        }
        else {
          appLogger.log(body)
          appLogger.log('Error on get Application: ' +
            body.error +
            ' (' + response.statusCode + ')')
          appLogger.log('Request data = ' + JSON.stringify(options))
          reject(response.statusCode)
        }
      }
      else {
        appLogger.log(body)
        resolve(ttnApplicationMeta.id)
      }
    })
  })
}

/**
 * @desc get an application from the The Things Network network
 *
 * @param session - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id to fetch from the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<Application>} - Remote application data
 */
module.exports.getApplication = function (session, network, applicationId, dataAPI) {
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
      'Authorization': 'Bearer ' + session.connection.access_token
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on get application: ', 'error')
        reject(error)
      }
      else {
        resolve(body)
      }
    })
  })
}

module.exports.getApplications = function (session, network, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let options = {}
    options.method = 'GET'
    options.url = network.baseUrl + '/api/v2/applications'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.connection.access_token
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    options.json = true
    appLogger.log(options)
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on get application: ', 'error')
        reject(error)
      }
      else {
        appLogger.log(response.headers)
        appLogger.log(body)
        resolve(body)
      }
    })
  })
}

/**
 * @desc Update an application on the The Things Network network
 *
 * @param session - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id for the application to update on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means application was updated on The Things Network network
 */
module.exports.updateApplication = function (session, network, applicationId, dataAPI) {
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
      'Authorization': 'Bearer ' + session.connection.access_token
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
        appLogger.log('Error on update application: ', 'error')
        reject(error)
      }
      else {
        appLogger.log(body)
        resolve()
      }
    })
  })
}

/**
 * @desc Delete an application to the The Things Network network
 *
 * @param session - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The application id for the application to delete on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means the application was deleted.
 */
module.exports.deleteApplication = function (session, network, applicationId, dataAPI) {
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
      'Authorization': 'Bearer ' + session.connection.access_token
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error) {
        appLogger.log('Error on delete application: ', 'error')
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

// Start the application.
//
// session   - The session data to access the account on the network.
// network       - The networks record for the network that uses this
// applicationId - The application's record id.
// dataAPI       - Gives access to the data records and error tracking for the
//                 operation.
//
// Returns a Promise that starts the application data flowing from the remote
// system.
module.exports.startApplication = function (session, network, applicationId, dataAPI) {
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
        'Authorization': 'Bearer ' + session.connection.access_token
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
// session   - The session data to access the account on the network.
// network       - The networks record for the network that uses this protocol.
// applicationId - The local application's id to be stopped.
// dataAPI       - Gives access to the data records and error tracking for the
//                 operation.
//
// Returns a Promise that stops the application data flowing from the remote
// system.
module.exports.stopApplication = function (session, network, applicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let appNwkId
    // Can't delete if not running on the network.
    if (this.activeApplicationNetworkProtocols['' + applicationId + ':' + network.id] === undefined) {
      // We don't think the app is running on this network.
      appLogger.log('Application ' + applicationId +
        ' is not running on network ' + network.id)
      reject(new Error('Application ' + applicationId +
        ' is not running on network ' + network.id))
    }

    try {
      appNwkId = await dataAPI.getProtocolDataForKey(
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
    }

    // Kill the Forwarding with LoRa App Server
    let options = {}
    options.method = 'DELETE'
    options.url = network.baseUrl + '/applications/' + appNwkId + '/integrations/http'
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.connection.access_token
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
    request(options, function (error, response, body) {
      if (error) {
        appLogger.log('Error on delete application notification: ', 'error')
        reject(error)
      }
      else {
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
    }
    catch (err) {
      reject(err)
    }

    resolve()
  })
}

function postSingleDevice (session, network, device, deviceProfile, application, remoteApplicationId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let ttnDevice = deNormalizeDeviceData(device.networkSettings, deviceProfile.networkSettings, application.networkSettings, remoteApplicationId)
    delete ttnDevice.attributes
    let options = getOptions('POST', 'http://us-west.thethings.network:8084', 'handler', 'applications/' + ttnDevice.app_id + '/devices', session.connection.access_token)
    options.json = ttnDevice
    appLogger.log(options, 'info')

    request(options, function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on create device: ', 'error')
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
          ttnDevice.dev_id)
        resolve(ttnDevice.dev_id)
      }
    })
  })
}

module.exports.addDevice = function (session, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let promiseList = [dataAPI.getDeviceById(deviceId),
      dataAPI.getDeviceNetworkType(deviceId, network.networkTypeId),
      dataAPI.getDeviceProfileByDeviceIdNetworkTypeId(deviceId, network.networkTypeId),
      dataAPI.getApplicationByDeviceId(deviceId)
    ]

    Promise.all(promiseList)
      .then(results => {
        let device = results[0]
        let dntl = results[1]
        let deviceProfile = results[2]
        let application = results[3]
        dataAPI.getApplicationNetworkType(application.id, network.networkTypeId)
          .then(applicationData=> {
            applicationData.networkSettings = JSON.parse(applicationData.networkSettings)
            appLogger.log(applicationData, 'error')
            dataAPI.getProtocolDataForKey(network.id, network.networkProtocolId,
              makeApplicationDataKey(application.id, 'appNwkId'))
              .then(remoteApplicationId => {
                dataAPI.getProtocolDataForKey(
                  network.id,
                  network.networkProtocolId,
                  makeApplicationDataKey(device.applicationId, 'appNwkId'))
                  .then(appNwkId => {
                    appLogger.log('Moment of Truth', 'error')
                    postSingleDevice(session, network, dntl, deviceProfile, applicationData, remoteApplicationId, dataAPI)
                      .then(result => {
                        appLogger.log('Success Adding Device ' + ' to ' + network.name, 'info')
                        resolve(result)
                      }).catch(err => {
                      appLogger.log(err, 'error')
                      reject(err)
                    })
                  })
              })
              .catch(err => {
                appLogger.log('Error fetching Remote Application Id', 'error')
                reject(err)
              })
          })
          .catch(err => {
            appLogger.log(err, 'error')
            appLogger.log('Could not retrieve application ntl: ', 'error')
            reject(new Error('Could not retrieve application ntl'))
          })
      })
      .catch(err => {
        appLogger.log(err, 'error')
        appLogger.log('Could not retrieve local device, dntl, and device profile: ', 'error')
        reject(new Error('Could not retrieve local device, dntl, and device profile: '))
      })
  })
}

/**
 * @desc get a device from the The Things Network network
 *
 * @param session - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param deviceId - The device id to fetch from the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<Application>} - Remote device data
 */
module.exports.getDevice = function (session, network, deviceId, dataAPI) {
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
        'Authorization': 'Bearer ' + session.connection.access_token
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }

      request(options, function (error, response, body) {
        if (error || response.statusCode >= 400) {
          if (error) {
            appLogger.log('Error on get device: ', 'error')
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
    }
    catch (err) {
      reject(err)
    }
  })
}

/**
 * @desc Update a device on the The Things Network network
 *
 * @param session - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The device id for the device to update on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means device was updated on The Things Network network
 */
module.exports.updateDevice = function (session, network, deviceId, dataAPI) {
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
    }
    catch (err) {
      appLogger.log('Failed to get supporting data for updateDevice: ' + err)
      reject(err)
      return
    }

    // Set up the request options.
    let options = {}
    options.method = 'PUT'
    options.url = network.baseUrl + '/devices/' + devNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.connection.access_token
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

/**
 * @desc Delete a device to the The Things Network network
 *
 * @param session - The session information for the user, including the connection
 *                      data for the The Things Network system
 * @param network - The networks record for the The Things Network network
 * @param applicationId - The device id for the device to delete on the The Things Network network
 * @param dataAPI - access to the data records and error tracking
 * @returns {Promise<?>} - Empty promise means the device was deleted.
 */
module.exports.deleteDevice = function (session, network, deviceId, dataAPI) {
  return new Promise(async function (resolve, reject) {
    let devNetworkId
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
    let options = {}
    options.method = 'DELETE'
    options.url = network.baseUrl + '/devices/' + devNetworkId
    options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.connection.access_token
    }
    options.agentOptions = {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }

    request(options, async function (error, response, body) {
      if (error || response.statusCode >= 400) {
        if (error) {
          appLogger.log('Error on delete device: ', 'error')
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

//* *****************************************************************************
// Companies & Device Profiles are not supported by The Things Network, the main LPWan user serves
// as a proxy for all user companies.
//* *****************************************************************************

/**
 * Companies are not supported by The Things Network
 *
 * @param session
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.addCompany = function (session, network, companyId, dataAPI) {
  return {}
}

/**
 * Companies are not supported by The Things Network
 *
 * @param session
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.getCompany = function (session, network, companyId, dataAPI) {
  return {}
}

/**
 * Companies are not supported by The Things Network
 *
 * @param session
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.updateCompany = function (session, network, companyId, dataAPI) {
  return {}
}

/**
 * Companies are not supported by The Things Network
 *
 * @param session
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.deleteCompany = function (session, network, companyId, dataAPI) {
  return {}
}

/**
 * Companies are not supported by The Things Network
 *
 * @param session
 * @param network
 * @param companyId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.pushCompany = function (session, network, companyId, dataAPI) {
  return {}
}

/**
 * Companies are not supported by The Things Network
 *
 * @param session
 * @param remoteOrganization
 * @param network
 * @param dataAPI
 * @returns {Error}
 */
module.exports.addRemoteCompany = function (session, remoteOrganization, network, dataAPI, modelAPI) {
  return {}
}

/**
 * Companies are not supported by The Things Network
 *
 * @param session
 * @param network
 * @param dataAPI
 * @param modelAPI
 * @returns {Error}
 */
module.exports.pullCompanies = function (session, network, dataAPI, modelAPI) {
  return {}
}

/**
 * Device Profiles are not supported by The Things Network
 *
 * @param session
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.addDeviceProfile = function (session, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: addDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  appLogger.log('Error on addDeviceProfile: ', 'error')
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param session
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.getDeviceProfile = function (session, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: getDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  appLogger.log('Error on getDeviceProfile: ', 'error')
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param session
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.updateDeviceProfile = function (session, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: updateDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  appLogger.log('Error on updateDeviceProfile: ', 'error')
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param session
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.deleteDeviceProfile = function (session, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: deleteDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  appLogger.log('Error on deleteDeviceProfile: ', 'error')
  return (error)
}

/**
 * Device Profiles are not supported by The Things Network
 * @param session
 * @param network
 * @param deviceProfileId
 * @param dataAPI
 * @returns {Error}
 */
module.exports.pushDeviceProfile = function (session, network, deviceProfileId, dataAPI) {
  appLogger.log('The Things Network: pushDeviceProfile')
  appLogger.log('Device Profiles are not supported by The Things Network')
  let error = new Error('Device Profiles are not supported by The Things Network')
  appLogger.log('Error on pushDeviceProfile: ', 'error')
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
    appLogger.log('Network security data is incomplete for ' + network.name)
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
        appLogger.log('Error on get Device: ', 'error')
        reject(error)
      }
      else if (response.statusCode >= 400) {
        appLogger.log('Error on get Device: ' +
          body.error +
          ' (' + response.statusCode + ')')
        reject(response.statusCode)
      }
      else {
        appLogger.log(body)
        resolve(body)
      }
    })
  })
};

function normalizeApplicationData (remoteApplication, remoteApplicationMeta, network) {
  appLogger.log(remoteApplication.app_id, 'error')
  appLogger.log(remoteApplicationMeta, 'error')

  let normalized = {
    description: remoteApplicationMeta.name,
    id: remoteApplication.app_id,
    name: remoteApplication.app_id,
    key: remoteApplicationMeta.access_keys[0].key,
    payloadCodec: remoteApplication.payload_format,
    payloadEncoderScript: remoteApplication.encoder,
    payloadDecoderScript: remoteApplication.decoder,
    validationScript: remoteApplication.validator,
    serviceProfileID: remoteApplicationMeta.handler,
    organizationID: network.securityData.username
  }
  if (remoteApplicationMeta.euis && remoteApplicationMeta.euis.length > 0) {
    normalized.applicationEUI = remoteApplicationMeta.euis[0]
  }
  return normalized
}

function deNormalizeApplicationData (remoteApplication) {
  let magicId = remoteApplication.id + '-lpwanserver-' + uuid()
  magicId = magicId.substr(0, 36)
  let ttnApplication = {
    ttnApplicationMeta: {
      id: magicId,
      name: remoteApplication.name,
      rights: [
        'settings',
        'delete',
        'collaborators',
        'devices'
      ],
      access_keys: [
        {
          'rights': [
            'settings',
            'devices',
            'messages:up:r',
            'messages:down:w'
          ],
          'name': 'lpwan'
        }
      ]
    },
    ttnApplicationData: {
      app_id: magicId,
      decoder: remoteApplication.payloadDecoderScript,
      encoder: remoteApplication.payloadEncoderScript,
      payload_format: remoteApplication.payloadCodec,
      validator: remoteApplication.validationScript
    }
  }

  if (remoteApplication.applicationEUI) {
    ttnApplication.ttnApplicationMeta.euis = [ remoteApplication.applicationEUI]
  }

  return ttnApplication
}

function normalizeDeviceProfileData (remoteDeviceProfile, remoteApplicationMeta) {
  let normalized = {
    id: remoteDeviceProfile.dev_id + '-profile',
    name: remoteDeviceProfile.description,
    networkServerID: remoteApplicationMeta.serviceProfileID,
    organizationID: remoteApplicationMeta.organizationID,
    supports32BitFCnt: remoteDeviceProfile.lorawan_device.uses32_bit_f_cnt,
    macVersion: '1.0.2',
    regParamsRevision: 'B',
    maxEIRP: 30
  }
  if (remoteDeviceProfile.lorawan_device.activation_constraints === 'otaa' || (remoteDeviceProfile.lorawan_device.app_key !== '')) {
    normalized.supportsJoin = true
  }
  else {
    normalized.supportsJoin = false
  }

  if (normalized.networkServerID === 'ttn-handler-us-west') {
    normalized.rfRegion = 'US902'
  }
  else if (normalized.networkServerID === 'ttn-handler-eu') {
    normalized.rfRegion = 'EU868'
  }
  else if (normalized.networkServerID === 'ttn-handler-asia-se') {
    normalized.rfRegion = 'China779'
  }
  else if (normalized.networkServerID === 'ttn-handler-brazil') {
    normalized.rfRegion = 'AS923'
  }
  else // default
  {
    normalized.rfRegion = 'US902'
  }

  function filterAttributes (attributes, key) {
    let temp = remoteDeviceProfile.attributes.filter(obj => obj.key === key)
    if (temp && temp.length > 0) {
      return temp[0].value
    }
    else {
      return ''
    }
  }

  if (remoteDeviceProfile.attributes && remoteDeviceProfile.attributes.length > 0) {
    normalized.classBTimeout = filterAttributes(remoteDeviceProfile.attributes, 'classBTimeout')
    normalized.classCTimeout = filterAttributes(remoteDeviceProfile.attributes, 'classCTimeout')
    normalized.factoryPresetFreqs = filterAttributes(remoteDeviceProfile.attributes, 'factoryPresetFreqs')
    normalized.macVersion = filterAttributes(remoteDeviceProfile.attributes, 'macVersion')
    normalized.maxDutyCycle = filterAttributes(remoteDeviceProfile.attributes, 'maxDutyCycle')
    normalized.maxEIRP = filterAttributes(remoteDeviceProfile.attributes, 'maxEIRP')
    normalized.pingSlotDR = filterAttributes(remoteDeviceProfile.attributes, 'pingSlotDR')
    normalized.pingSlotFreq = filterAttributes(remoteDeviceProfile.attributes, 'pingSlotFreq')
    normalized.pingSlotPeriod = filterAttributes(remoteDeviceProfile.attributes, 'pingSlotPeriod')
    normalized.regParamsRevision = filterAttributes(remoteDeviceProfile.attributes, 'regParamsRevision')
    normalized.rxDROffset1 = filterAttributes(remoteDeviceProfile.attributes, 'rxDROffset1')
    normalized.rxDataRate2 = filterAttributes(remoteDeviceProfile.attributes, 'rxDataRate2')
    normalized.rxDelay1 = filterAttributes(remoteDeviceProfile.attributes, 'rxDelay1')
    normalized.rxFreq2 = filterAttributes(remoteDeviceProfile.attributes, 'rxFreq2')
    normalized.supportsClassB = filterAttributes(remoteDeviceProfile.attributes, 'supportsClassB')
    normalized.supportsClassC = filterAttributes(remoteDeviceProfile.attributes, 'supportsClassC')
  }
  return normalized
}

function normalizeDeviceData (remoteDevice, deviceProfileId) {
  let normalized = {
    applicationID: remoteDevice.app_id,
    description: remoteDevice.description,
    devEUI: remoteDevice.lorawan_device.dev_eui,
    deviceProfileID: deviceProfileId,
    name: remoteDevice.dev_id,
    skipFCntCheck: false,
    deviceStatusBattery: '',
    deviceStatusMargin: '',
    lastSeenAt: remoteDevice.lorawan_device.last_seen
  }
  //TTN only supports 1.0.x currently, so  nwkKey == appKey for conversion
  if (remoteDevice.lorawan_device.activation_constraints === 'otaa' || (remoteDevice.lorawan_device.app_key !== '')) {
    normalized.deviceKeys = {
      appKey: remoteDevice.lorawan_device.app_key,
      devEUI: remoteDevice.lorawan_device.dev_eui,
      nwkKey: remoteDevice.lorawan_device.app_key
    }
  }
  else {
    normalized.deviceActivation = {
      aFCntDown: remoteDevice.lorawan_device.f_cnt_down,
      appSKey: remoteDevice.lorawan_device.app_s_key,
      devAddr: remoteDevice.lorawan_device.dev_addr,
      devEUI: remoteDevice.lorawan_device.dev_eui,
      fCntUp: remoteDevice.lorawan_device.f_cnt_up,
      nFCntDown: remoteDevice.lorawan_device.f_cnt_down,
      nwkSEncKey: remoteDevice.lorawan_device.nwk_s_key,
      sNwkSIntKey: remoteDevice.lorawan_device.nwk_s_key,
      fNwkSIntKey: remoteDevice.lorawan_device.nwk_s_key
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
function deNormalizeDeviceData (localDevice, localDeviceProfile, application, remoteApplicationId) {
  let ttnDeviceData = {
    altitude: 0,
    app_id: remoteApplicationId,
    description: localDevice.description,
    dev_id: localDevice.devEUI,
    latitude: 52.375,
    longitude: 4.887,
    lorawan_device: {
      activation_constraints: 'otaa',
      app_eui: application.applicationEUI,
      app_id: remoteApplicationId,
      dev_eui: localDevice.devEUI,
      dev_id: localDevice.devEUI,
      last_seen: localDevice.lastSeenAt,
      uses32_bit_f_cnt: localDeviceProfile.supports32BitFCnt
    }
  }

  if (!localDevice.lastSeenAt || localDevice.lastSeenAt === '') {
    ttnDeviceData.lorawan_device.last_seen = 0
  }

  if (localDeviceProfile.supportsJoin) {
    ttnDeviceData.lorawan_device.activation_constraints = 'otta',
    ttnDeviceData.lorawan_device.app_key = localDevice.deviceKeys.appKey
  }
  else {
    ttnDeviceData.lorawan_device.activation_constraints = 'abp'
    ttnDeviceData.lorawan_device.app_s_key = localDevice.deviceActivation.appSKey
    ttnDeviceData.lorawan_device.nwk_s_key = localDevice.deviceActivation.nwkSEncKey
    ttnDeviceData.lorawan_device.dev_addr = localDevice.deviceActivation.devAddr
    ttnDeviceData.lorawan_device.f_cnt_down = localDevice.deviceActivation.nFCntDown
    ttnDeviceData.lorawan_device.f_cnt_up = localDevice.deviceActivation.fCntUp
    ttnDeviceData.lorawan_device.disable_f_cnt_check = false
  }

  ttnDeviceData.attributes = []
  if (localDeviceProfile.classBTimeout) ttnDeviceData.attributes.push({key: 'classBTimeout', value: localDeviceProfile.classBTimeout})
  if (localDeviceProfile.classCTimeout) ttnDeviceData.attributes.push({key: 'classCTimeout', value: localDeviceProfile.classCTimeout})
  if (localDeviceProfile.factoryPresetFreqs) ttnDeviceData.attributes.push({key: 'factoryPresetFreqs', value: localDeviceProfile.factoryPresetFreqs})
  if (localDeviceProfile.macVersion) ttnDeviceData.attributes.push({key: 'factoryPresetFreqs', value: localDeviceProfile.macVersion})
  if (localDeviceProfile.maxDutyCycle) ttnDeviceData.attributes.push({key: 'maxDutyCycle', value: localDeviceProfile.maxDutyCycle})
  if (localDeviceProfile.maxEIRP) ttnDeviceData.attributes.push({key: 'maxEIRP', value: localDeviceProfile.maxEIRP})
  if (localDeviceProfile.pingSlotDR) ttnDeviceData.attributes.push({key: 'pingSlotDR', value: localDeviceProfile.pingSlotDR})
  if (localDeviceProfile.pingSlotFreq) ttnDeviceData.attributes.push({key: 'pingSlotFreq', value: localDeviceProfile.pingSlotFreq})
  if (localDeviceProfile.pingSlotPeriod) ttnDeviceData.attributes.push({key: 'pingSlotPeriod', value: localDeviceProfile.pingSlotPeriod})
  if (localDeviceProfile.regParamsRevision) ttnDeviceData.attributes.push({key: 'pingSlotPeriod', value: localDeviceProfile.regParamsRevision})
  if (localDeviceProfile.rxDROffset1) ttnDeviceData.attributes.push({key: 'rxDROffset1', value: localDeviceProfile.rxDROffset1})
  if (localDeviceProfile.rxDataRate2) ttnDeviceData.attributes.push({key: 'rxDataRate2', value: localDeviceProfile.rxDataRate2})
  if (localDeviceProfile.rxDelay1) ttnDeviceData.attributes.push({key: 'rxDelay1', value: localDeviceProfile.rxDelay1})
  if (localDeviceProfile.rxFreq2) ttnDeviceData.attributes.push({key: 'rxFreq2', value: localDeviceProfile.rxFreq2})
  if (localDeviceProfile.supportsClassB) ttnDeviceData.attributes.push({key: 'supportsClassB', value: localDeviceProfile.supportsClassB})
  if (localDeviceProfile.supportsClassC) ttnDeviceData.attributes.push({key: 'supportsClassC', value: localDeviceProfile.supportsClassC})

  appLogger.log(ttnDeviceData, 'info')
  return ttnDeviceData
}
