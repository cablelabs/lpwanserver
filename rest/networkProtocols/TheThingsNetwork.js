const request = require('request-promise')
const nconf = require('nconf')
const appLogger = require('../lib/appLogger.js')
const uuid = require('uuid/v1')
const R = require('ramda')

/**********************************************************************************************************************
 * Bookeeping: Register, Test, Connect
 *********************************************************************************************************************/

function tryAsync (promise) {
  return promise.then(
    x => ([null, x]),
    err => ([err])
  )
}

function checkTtnResponse ({ statusCode, body }) {
  if (statusCode >= 200 && statusCode < 300) return
  const throwError = msg => {
    let error = new Error(msg)
    error.statusCode = statusCode
    throw error
  }
  switch (statusCode) {
    case 401: return throwError('Unauthorized')
    case 404: return throwError('URL Is Incorrect')
    case 400:
      appLogger.log(body)
      return throwError('Bad Request')
    default:
      return throwError(statusCode)
  }
}

async function TTNRequest (token, opts) {
  opts = Object.assign({
    method: 'GET',
    json: true,
    resolveWithFullResponse: true,
    headers: {
      authorization: `Bearer ${token}`
    },
    agentOptions: {
      'secureProtocol': 'TLSv1_2_method',
      'rejectUnauthorized': false
    }
  }, opts)
  appLogger.log(R.merge(
    opts,
    {
      headers: R.merge(opts.headers, {
        authorization: 'Bearer OMIT TOKEN IN LOG'
      })
    }
  ), 'info')
  const response = await request(opts)
  checkTtnResponse(response)
  appLogger.log(response.body)
  return response.body
}

async function TTNAppRequest (network, connection, appId, opts, secondAttempt = false) {
  if (!connection.appTokens) connection.appTokens = {}
  if (!connection.appTokens[appId]) {
    try {
      const body = await TTNRequest(connection.access_token, {
        method: 'POST',
        url: `${network.baseUrl}/users/restrict-token`,
        body: {
          scope: [`apps:${appId}`]
        }
      })
      connection.appTokens[appId] = body.access_token
    } catch (err) {
      appLogger.log(`Error fetching token for app ${appId}. ${err.message}`, err)
      throw err
    }
  }
  try {
    return TTNRequest(connection.appTokens[appId], opts)
  } catch (err) {
    if (secondAttempt || (err.statusCode !== 401 && error.statusCode !== 403)) throw err
    delete connection.appTokens[appId]
    return TTNAppRequest(network, connection, appId, opts, true)
  }
}

async function TTNAuthenticationRequest (network, loginData, opts = {}) {
  let auth = Buffer
    .from(`${loginData.clientId}:${loginData.clientSecret}`)
    .toString('base64')
  const body = await TTNRequest(null, Object.assign({
    method: 'POST',
    url: `${network.baseUrl}/users/token`,
    headers: {
      authorization: `Basic ${auth}`
    }
  }, opts))
  if (!body.access_token) {
    throw new Error('No Token')
  }
  return body
}

const appRegion = R.compose(
  R.replace('ttn-handler-', ''),
  x => x.handler || x.serviceProfileID
  // R.tap(x => console.log('**appRegion**', require('util').inspect(x)))
)

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
module.exports.register = async function register (networkProtocols) {
  appLogger.log('TTN:register', 'info')
  await networkProtocols.upsertNetworkProtocol({
    name: 'The Things Network',
    networkTypeId: 1,
    protocolHandler: 'TheThingsNetwork.js',
    networkProtocolVersion: '2.0'
  })
}

/**
 * Test the network to verify it functions correctly.
 *
 * @param network - network to test
 * @param loginData - credentials
 * @returns {Promise<any>}
 */
module.exports.test = async function testNetwork(network, loginData) {
  appLogger.log(network.securityData, 'debug')
  if (!network.securityData.authorized) {
    throw new Error('Not Authorized')
  }
  try {
    return TTNRequest(network.securityData.access_token, {
      url: `${network.baseUrl}/api/v2/applications`
    })
  } catch (err) {
    appLogger.log('Test Error: ' + err)
    throw err
  }
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

async function authorizeWithPassword (network, loginData, scope) {
  if (!scope || !scope.length) {
    scope = ['apps', 'gateways', 'components', 'apps:cable-labs-prototype']
  }
  try {
    return TTNAuthenticationRequest(network, loginData, {
      body: {
        grant_type: 'password',
        username: loginData.username,
        password: loginData.password,
        scope
      }
    })
  } catch (e) {
    appLogger.log('Error on signin: ' + e)
    throw e
  }
}

async function authorizeWithCode (network, loginData) {
  try {
    return TTNAuthenticationRequest(network, loginData, {
      body: {
        grant_type: 'authorization_code',
        code: loginData.code,
        redirect_url: loginData.redirect_uri
      }
    })
  } catch (e) {
    appLogger.log('Error on signin: ' + e)
    throw e
  }
}

async function authorizeWithRefreshToken (network, loginData) {
  try {
    const body = await TTNAuthenticationRequest(network, loginData, {
      body: {
        grant_type: 'refresh_token',
        refresh_token: loginData.refresh_token,
        redirect_url: loginData.redirect_uri
      }
    })
    body.username = 'TTNUser'
    return body
  } catch (e) {
    appLogger.log('Error on signin: ' + e)
    throw e
  }
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
module.exports.disconnect = async function (connection) {
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
  try {
    const pulledResources = await this.pullApplications(session, network, modelAPI, dataAPI)
    const devices = await Promise.all(pulledResources.map((x, i) => {
      return this.pullDevices(session, network, x.remoteApplication, x.localApplication, {}, modelAPI, dataAPI)
      // devicePromistList.push(this.pullIntegrations(session, network, pulledResources[1][i].remoteApplication, pulledResources[1][i].localApplication, pulledResources[0], modelAPI, dataAPI))
    }))
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
module.exports.pullApplications = async function pullApplications (session, network, modelAPI, dataAPI) {
  const access_token = R.path(['connection', 'access_token'], session || {})
  if (!access_token) {
    throw new Error('Network ' + network.name + ' is not authorized')
  }
  try {
    const apps = await TTNRequest(access_token, {
      url: 'https://console.thethingsnetwork.org/api/applications'
    })
    network.securityData.appKeys = apps.map(x => ({ app: x.id, key: x.access_keys[0].key }))
    return Promise.all(apps.map(x => addRemoteApplication(session, x, network, modelAPI, dataAPI)))
  } catch (e) {
    appLogger.log('Error pulling applications from network ' + network.name + ': ' + e)
    throw e
  }
}

async function addRemoteApplication (session, limitedRemoteApplication, network, modelAPI, dataAPI) {
  try {
    let remoteApplication = await getApplicationById(network, limitedRemoteApplication, session.connection)
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
      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocolId,
        makeApplicationDataKey(existingApplication.id, 'appNwkId'),
        normalizedApplication.id
      )
    }
    return { localApplication: existingApplication, remoteApplication: normalizedApplication }
  }
  catch (e) {
    appLogger.log(e, 'error')
    throw e
  }
}

// Get the NetworkServer using the Service Profile a ServiceProfile.
async function getApplicationById (network, appOrId, connection) {
  appLogger.log('LoRaOpenSource: getApplicationById', 'debug')
  let app = appOrId
  let appId = typeof app === 'string' ? app : app.id
  try {
    if (typeof app === 'string' || !app.handler) {
      app = await TTNAppRequest(network, connection, appId, {
        url: `https://console.thethingsnetwork.org/api/applications/${appId}`
      })
    }
    
    return TTNAppRequest(network, connection, appId, {
      url: `http://${appRegion(app)}.thethings.network:8084/applications/${appId}`
    })
  } catch (e) {
    appLogger.log('Error on get Application: ' + e)
    throw e
  }
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
module.exports.pullDevices = async function pullDevices (session, network, remoteApplication, localApplication, dpMap, modelAPI, dataAPI) {
  try {
    const body = await TTNAppRequest(network, session.connection, remoteApplication.id, {
      url: `http://${appRegion(remoteApplication)}.thethings.network:8084/applications/${remoteApplication.id}/devices`
    })
    const { devices = [] } = body
    await Promise.all(devices.map(device => {
      return addRemoteDevice(session, device, network, localApplication.id, dpMap, modelAPI, dataAPI)
    }))
    return devices
  } catch (e) {
    appLogger.log('Error pulling devices from network ' + network.name, 'error')
    appLogger.log(e, 'error')
    throw e
  }
}

async function addRemoteDevice (session, remoteDevice, network, applicationId, dpMap, modelAPI, dataAPI) {
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
    return { localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id }
  }
  appLogger.log('creating Network Link for ' + existingDevice.name)
  try {
    const dp = await addRemoteDeviceProfile(session, remoteDevice, existingApplicationNTL, network, modelAPI, dataAPI)
    appLogger.log(dp, 'info')
    let normalizedDevice = normalizeDeviceData(remoteDevice, dp.localDeviceProfile)
    appLogger.log(normalizedDevice)
    const existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.createRemoteDeviceNetworkTypeLink(existingDevice.id, network.networkTypeId, dp.localDeviceProfile, normalizedDevice, 2)
    appLogger.log(existingDeviceNTL)
    await dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceDataKey(existingDevice.id, 'devNwkId'),
      remoteDevice.dev_id
    )
    appLogger.log({localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id})
    return { localDevice: existingDevice.id, remoteDevice: remoteDevice.dev_id }
  } catch (e) {
    appLogger.log(e, 'error')
    throw e
  }
}

async function addRemoteDeviceProfile (session, remoteDevice, application, network, modelAPI, dataAPI) {
  let networkSpecificDeviceProfileInformation = normalizeDeviceProfileData(remoteDevice, application)
  appLogger.log(networkSpecificDeviceProfileInformation, 'error')
  try {
    const existingDeviceProfile = await modelAPI.deviceProfiles.createRemoteDeviceProfile(
      network.networkTypeId,
      2,
      networkSpecificDeviceProfileInformation.name,
      'Device Profile managed by LPWAN Server, perform changes via LPWAN',
      networkSpecificDeviceProfileInformation
    )
    return {
      localDeviceProfile: existingDeviceProfile.id,
      remoteDeviceProfile: existingDeviceProfile.id
    }
  } catch (e) {
    appLogger.log(e)
    throw e
  }
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
module.exports.pushNetwork = async function pushNetwork (session, network, dataAPI, modelAPI) {
  try {
    await this.pushApplications(session, network, dataAPI, modelAPI)
    const pushedResource = await this.pushDevices(session, network, dataAPI, modelAPI)
    appLogger.log('Success Pushing Network ' + network.name, 'info')
    appLogger.log(pushedResource, 'info')
  } catch (e) {
    appLogger.log(e, 'error')
    throw e
  }
}

module.exports.pushApplications = async function pushApplications (session, network, dataAPI, modelAPI) {
  try {
    let existingApplications = await modelAPI.applications.retrieveApplications()
    appLogger.log(existingApplications, 'info')
    const pushedResources = await Promise.all(existingApplications.records.map(record => {
      return this.pushApplication(session, network, record, dataAPI, modelAPI)
    }))
    appLogger.log('Success Pushing Applications', 'info')
    appLogger.log(pushedResources, 'info')
    return pushedResources
  } catch (e) {
    appLogger.log(e, 'error')
    throw e
  }
}

module.exports.pushApplication = async function pushApplication (session, network, application, dataAPI, modelAPI ) {
  appLogger.log(application, 'error')
  const badProtocolTableError = new Error('Bad things in the Protocol Table')
  try {
    // See if it already exists
    const appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(application.id, 'appNwkId')
    )
    if (!appNetworkId) {
      throw badProtocolTableError
    }
    appLogger.log('Ignoring Application  ' + application.id + ' already on network ' + network.name + ' as ' + appNetworkId, 'info')
    return { localApplication: application.id, remoteApplication: appNetworkId }
  } catch (e) {
    if (e === badProtocolTableError) throw e
    try {
      appLogger.log('Pushing Application ' + application.name, 'info')
      const appNetworkId = await this.addApplication(session, network, application.id, dataAPI, modelAPI)
      appLogger.log('Added application ' + application.id + ' to network ' + network.name, 'info')
      return { localApplication: application.id, remoteApplication: appNetworkId }
    } catch (err) {
      appLogger.log(err, 'error')
      throw err
    }
  }
}

module.exports.pushDevices = async function pushDevices (sessionData, network, dataAPI, modelAPI) {
  try {
    let existingDevices = await modelAPI.devices.retrieveDevices()
    const pushedResources = await Promise.all(existingDevices.records.map(record => {
      return this.pushDevice(sessionData, network, record, dataAPI)
    }))
    appLogger.log(pushedResources)
    return pushedResources
  } catch (e) {
    appLogger.log(e, 'error')
    throw e
  }
}

module.exports.pushDevice = async function pushDevice (sessionData, network, device, dataAPI) {
  const badProtocolTableError = new Error('Something bad happened with the Protocol Table')
  try {
    const devNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceDataKey(device.id, 'devNwkId')
    )
    appLogger.log('Ignoring Device  ' + device.id + ' already on network ' + network.name, 'info')
    if (devNetworkId) {
      return { localDevice: device.id, remoteDevice: devNetworkId }
    }
    appLogger.log(devNetworkId + ' found for network ' + network.name + ' for device ' + device.id, 'info')
    throw badProtocolTableError
  } catch (e) {
    if (e === badProtocolTableError) throw e
    try {
      appLogger.log('Adding Device  ' + device.id + ' to network ' + network.name, 'info')
      const devNetworkId = await this.addDevice(sessionData, network, device.id, dataAPI)
      appLogger.log('Added Device  ' + device.id + ' to network ' + network.name, 'info')
      return { localDevice: device.id, remoteDevice: devNetworkId }
    } catch (err) {
      appLogger.log(err, 'error')
      throw err

    }
  }
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
module.exports.addApplication = async function addApplication (session, network, applicationId, dataAPI, modelAPI) {
  let application
  let applicationData
  try {
    // Get the local application data.
    application = await dataAPI.getApplicationById(applicationId)
    applicationData = await dataAPI.getApplicationNetworkType(applicationId, network.networkTypeId)
  }
  catch (err) {
    appLogger.log('Failed to get required data for addApplication: ' + applicationId, 'error')
    throw err
  }
  let ttnApplication = deNormalizeApplicationData(applicationData.networkSettings)
  try {
    const body = await TTNRequest(session.connection.access_token, {
      method: 'POST',
      url: network.baseUrl + '/applications',
      body: ttnApplication.ttnApplicationMeta
    })
    applicationData.networkSettings.applicationEUI = body.euis[0]
    appLogger.log(applicationData, 'error')
    await modelAPI.applicationNetworkTypeLinks.updateRemoteApplicationNetworkTypeLink(applicationData, 2)
    await dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(application.id, 'appNwkId'),
      body.id
    )
    return this.registerApplicationWithHandler(session.connection, network, ttnApplication.ttnApplicationData, body, dataAPI)
  } catch (err) {
    appLogger.log('Error on create application: ' + err, 'error')
    appLogger.log(err, 'error')
    throw err
  }
}

module.exports.registerApplicationWithHandler = async function registerApplicationWithHandler (connection, network, ttnApplication, ttnApplicationMeta, dataAPI) {
  try {
    await TTNAppRequest(network, connection, ttnApplication.app_id, {
      method: 'POST',
      url: `http://us-west.thethings.network:8084/applications`,
      body: { app_id: ttnApplication.app_id }
    })
    return this.setApplication(connection, network, ttnApplication, ttnApplicationMeta, dataAPI)
  } catch (e) {
    appLogger.log('Error on register Application: ' + e, 'error')
    throw e
  }
}

module.exports.setApplication = async function setApplication (connection, network, ttnApplication, ttnApplicationMeta, dataAPI) {
  try {
    await TTNAppRequest(network, connection, ttnApplicationMeta.id, {
      method: 'PUT',
      url: `http://us-west.thethings.network:8084/applications/${ttnApplicationMeta.id}`,
      body: ttnApplication
    })
    return ttnApplicationMeta.id
  } catch (e) {
    appLogger.log('Error on get Application: ' + e, 'error')
    throw e
  }
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
module.exports.getApplication = async function getApplication (session, network, applicationId, dataAPI) {
  try {
    let appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId')
    )
    return TTNAppRequest(network, session.connection, true, {
      url: network.baseUrl + '/applications/' + appNetworkId
    })
  } catch (e) {
    appLogger.log('Error on get application: ' + e, 'error')
    throw e
  }
}

module.exports.getApplications = async function getApplications (session, network, dataAPI) {
  try {
    return TTNRequest(session.connection.access_token, {
      url: network.baseUrl + '/api/v2/applications'
    })
  } catch (e) {
    appLogger.log('Error on get application: ', 'error')
    throw e
  }
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
module.exports.updateApplication = async function updateApplication (session, network, applicationId, dataAPI) {
  try {
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

    // build body
    const body = {
      'id': appNetworkId,
      'name': application.name,
      'organizationID': coNetworkId,
      'description': 'This Application is Managed by LPWanServer',
      'payloadCodec': '',
      'payloadDecoderScript': '',
      'payloadEncoderScript': ''
    }

    // Optional data
    if (applicationData && applicationData.networkSettings) {
      if (applicationData.networkSettings.isABP) {
        body.isABP = applicationData.networkSettings.isABP
      }
      if (applicationData.networkSettings.isClassC) {
        body.isClassC = applicationData.networkSettings.isClassC
      }
      if (applicationData.networkSettings.relaxFCnt) {
        body.relaxFCnt = applicationData.networkSettings.relaxFCnt
      }
      if (applicationData.networkSettings.rXDelay) {
        body.rXDelay = applicationData.networkSettings.rXDelay
      }
      if (applicationData.networkSettings.rX1DROffset) {
        body.rX1DROffset = applicationData.networkSettings.rX1DROffset
      }
      if (applicationData.networkSettings.rXWindow) {
        body.rXWindow = applicationData.networkSettings.rXWindow
      }
      if (applicationData.networkSettings.rX2DR) {
        body.rX2DR = applicationData.networkSettings.rX2DR
      }
      if (applicationData.networkSettings.aDRInterval) {
        body.aDRInterval = applicationData.networkSettings.aDRInterval
      }
      if (applicationData.networkSettings.installationMargin) {
        body.installationMargin = applicationData.networkSettings.installationMargin
      }
      if (applicationData.networkSettings.payloadCodec && applicationData.networkSettings.payloadCodec !== 'NONE') {
        body.payloadCodec = applicationData.networkSettings.payloadCodec
      }
      if (applicationData.networkSettings.payloadDecoderScript) {
        body.payloadDecoderScript = applicationData.networkSettings.payloadDecoderScript
      }
      if (applicationData.networkSettings.payloadEncoderScript) {
        body.payloadEncoderScript = applicationData.networkSettings.payloadEncoderScript
      }
    }
    
    appLogger.log(application)
    appLogger.log(applicationData)

    await TTNAppRequest(network, session.connection, appNetworkId, {
      method: 'PUT',
      url: network.baseUrl + '/applications/' + appNetworkId,
      body
    })
    return
  } catch (e) {
    appLogger.log('Error on update application: ', 'error')
    throw e
  }
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
module.exports.deleteApplication = async function deleteApplication (session, network, applicationId, dataAPI) {
  try {
    // Get the application data.
    let appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId')
    )
    await TTNAppRequest(network, session.connection, appNetworkId, {
      method: 'DELETE',
      url: network.baseUrl + '/applications/' + appNetworkId
    })
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId')
    )
  } catch (err) {
    appLogger.log('Error on delete application: ', 'error')
    throw err
  }
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
module.exports.startApplication = async function startApplication (session, network, applicationId, dataAPI) {
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
      makeApplicationDataKey(applicationId, 'appNwkId')
    )
    await TTNAppRequest(network, session.connection, appNwkId, {
      method: 'POST',
      url: network.baseUrl + '/applications/' + appNwkId + '/integrations/http'
    })
  }
  catch (err) {
    appLogger.log('Error on add application data reporting: ' + err)
    reject(err)
  }
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
module.exports.stopApplication = async function stopApplication (session, network, applicationId, dataAPI) {
  let appNwkId
  // Can't delete if not running on the network.
  if (this.activeApplicationNetworkProtocols['' + applicationId + ':' + network.id] === undefined) {
    // We don't think the app is running on this network.
    const msg = 'Application ' + applicationId + ' is not running on network ' + network.id
    appLogger.log(msg)
    throw new Error(msg)
  }

  try {
    appNwkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(applicationId, 'appNwkId')
    )
  }
  catch (err) {
    appLogger.log('Cannot delete application data forwarding for application ' +
      applicationId +
      ' and network ' +
      network.name +
      ': ' + err)
    throw err
  }
  // Kill the Forwarding with LoRa App Server
  try {
    await TTNAppRequest(network, session.connection, appNwkId, {
      method: 'DELETE',
      url: network.baseUrl + '/applications/' + appNwkId + '/integrations/http'
    })
    delete this.activeApplicationNetworkProtocols['' + applicationId + ':' + network.id]
  } catch (err) {
    appLogger.log('Error on delete application notification: ', 'error')
    throw err
  }
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

async function postSingleDevice (session, network, device, deviceProfile, application, remoteApplicationId, dataAPI) {
  try {
    console.log('******postSingleDevice******')
    console.log(JSON.stringify(device, null, 2))
    let ttnDevice = deNormalizeDeviceData(device.networkSettings, deviceProfile.networkSettings, application.networkSettings, remoteApplicationId)
    delete ttnDevice.attributes
    await TTNAppRequest(network, session.connection, ttnDevice.app_id, {
      method: 'POST',
      url: `http://us-west.thethings.network:8084/applications/${ttnDevice.app_id}/devices`,
      body: ttnDevice
    })
    await dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceDataKey(device.id, 'devNwkId'),
      ttnDevice.dev_id
    )
    return ttnDevice.dev_id
  } catch (err) {
    appLogger.log('Error on create device: ', 'error')
    throw err
  }
}

module.exports.addDevice = async function addDevice (session, network, deviceId, dataAPI) {
  let result
  let promiseList = [
    dataAPI.getDeviceById(deviceId),
    dataAPI.getDeviceNetworkType(deviceId, network.networkTypeId),
    dataAPI.getDeviceProfileByDeviceIdNetworkTypeId(deviceId, network.networkTypeId),
    dataAPI.getApplicationByDeviceId(deviceId)
  ]
  try {
    result = await tryAsync(Promise.all(promiseList))
    if (result[0]) {
      appLogger.log('Could not retrieve local device, dntl, and device profile: ', 'error')
      throw new Error('Could not retrieve local device, dntl, and device profile: ')
    }
    let [device, dntl, deviceProfile, application] = result[1]
    result = await tryAsync(dataAPI.getApplicationNetworkType(application.id, network.networkTypeId))
    if (result[0]) {
      appLogger.log('Could not retrieve application ntl: ', 'error')
      throw new Error('Could not retrieve application ntl')
    }
    const applicationData = result[1]
    result = await tryAsync(dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeApplicationDataKey(application.id, 'appNwkId')
    ))
    if (result[0]) {
      appLogger.log('Error fetching Remote Application Id', 'error')
      throw result[0]
    }
    const remoteApplicationId = result[1]
    appLogger.log('Moment of Truth', 'error')
    const postDeviceResult = await postSingleDevice(session, network, dntl, deviceProfile, applicationData, remoteApplicationId, dataAPI)
    appLogger.log('Success Adding Device ' + ' to ' + network.name, 'info')
    return postDeviceResult
  } catch (err) {
    appLogger.log(err, 'error')
    throw err
  }
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
module.exports.getDevice = async function getDevice (session, network, deviceId, dataAPI) {
  try {
    let devNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocolId,
      makeDeviceDataKey(deviceId, 'devNwkId')
    )
    return TTNRequest(session.connection.access_token, {
      url: network.baseUrl + '/devices/' + devNetworkId
    })
  }
  catch (err) {
    appLogger.log('Error on get device: ', 'error')
    throw err
  }
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
module.exports.updateDevice = async function updateDevice (session, network, deviceId, dataAPI) {
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
    throw err
  }

  try {
    await TTNRequest(session.connection.access_token, {
      method: 'PUT',
      url: network.baseUrl + '/devices/' + devNetworkId,
      body: {
        'applicationID': appNwkId,
        'description': device.name,
        'devEUI': dntl.networkSettings.devEUI,
        'deviceProfileID': dpNwkId,
        'name': device.name
      }
    })
    // Devices have a separate API for appkeys...
    try {
      await TTNRequest(session.connection.access_token, {
        url: network.baseUrl + '/devices/' + dntl.networkSettings.devEUI + '/keys',
        body: {
          'devEUI': dntl.networkSettings.devEUI,
          'deviceKeys': {
            'appKey': dntl.networkSettings.appKey
          }
        }
      })
    } catch (err) {
      appLogger.log('Error on update device keys: ', 'error')
      throw err
    }
  } catch (err) {
    appLogger.log('Error on update device: ', 'error')
    throw err
  }
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
module.exports.deleteDevice = async function deleteDevice (session, network, deviceId, dataAPI) {
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
    throw err
  }

  try {
    await TTNRequest(session.connection.access_token, {
      method: 'DELETE',
      url: network.baseUrl + '/devices/' + devNetworkId,
    })
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
    await TTNRequest(session.connection.access_token, {
      method: 'DELETE',
      url: network.baseUrl + '/devices/' + devNetworkId + '/keys'
    })
  } catch (err) {
    appLogger.log('Error on delete device: ', 'error')
    throw err
  }
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
async function getDeviceById (network, deviceId, connection, dataAPI) {
  appLogger.log('The Things Network: getDeviceById')
  try {
    return TTNRequest(connection, {
      url: network.baseUrl + '/devices/' + deviceId
    })
  } catch (err) {
    appLogger.log('Error on get Device: ', 'error')
    throw err
  }
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
  else if (localDevice.deviceActivation) {
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