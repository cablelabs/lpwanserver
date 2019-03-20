const NetworkProtocol = require('../../classes/NetworkProtocol')
const R = require('ramda')
const appLogger = require('../../lib/appLogger.js')
const request = require('request-promise')
const httpError = require('http-errors')

module.exports = class LoraOpenSource extends NetworkProtocol {
  request (opts, network, session) {
    opts.url = `${network.baseUrl}/${opts.url}`
    // remove possible double slash
    opts.url = opts.url.replace(/([^:]\/)\/+/g, '$1')
    if (opts.json == null) opts.json = true
    opts.agentOptions = {
      secureProtocol: 'TLSv1_2_method',
      rejectUnauthorized: false
    }
    if (session) {
      opts.headers = R.merge(opts.headers, { Authorization: `Bearer ${session.connection}` })
    }
    return request(opts)
  }

  async test (network) {
    if (!network.securityData.authorized) {
      throw httpError.Unauthorized()
    }
    let opts = {
      url: '/applications?limit=1&offset=0',
      headers: {
        'Authorization': 'Bearer ' + network.securityData.access_token
      },
      agentOptions: {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      },
      json: true
    }
    await request(opts)
    return true
  }

  getCompanyAccessAccount (network) {
    const result = super.getCompanyAccessAccount(network)
    return {
      ...R.pick(['username', 'password'], result),
      isAdmin: true
    }
  }

  async getCompanyAccount (dataAPI, network, companyId, generateIfMissing) {
    // Obtain the security data from the protocol storage in the dataAPI, then
    // access it for the user.
    var srd
    var kd
    var secData
    try {
      srd = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(companyId, 'sd')
      )
      kd = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(companyId, 'kd')
      )
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
        secData = { 'username': uname, 'password': pass }
        srd = dataAPI.hide(network, secData, kd)
        appLogger.log(uname)
        appLogger.log(pass)

        // Save for future reference.networkId, networkProtocolId, key, data
        await dataAPI.putProtocolDataForKey(
          network.id,
          network.networkProtocol.id,
          makeCompanyDataKey(companyId, 'sd'),
          srd)

        await dataAPI.putProtocolDataForKey(
          network.id,
          network.networkProtocol.id,
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
  }

  async connect (network, loginData) {
    const opts = { method: 'POST', url: '/internal/login', body: loginData }
    const body = await appLogger.logOnThrow(
      () => this.request(opts, network),
      err => `Error on signin: ${err}`
    )
    return body.jwt
  }

  async addCompany (session, network, companyId, dataAPI) {
    let company = await dataAPI.getCompanyById(companyId)

    // Set up the request options.
    const opts = {
      method: 'POST',
      url: '/organizations',
      body: this.buildOrg(company)
    }
    
    let body = await appLogger.logOnThrow(
      () => request(opts, network, session),
      err => `Error on create company ${company.name}: ${err}`
    )
    appLogger.log(body)

    await dataAPI.putProtocolDataForKey(network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(company.id, 'coNwkId'),
      body.id
    )

    try {
      await this.addDefaultCompanyAdminUser(session, network, company, dataAPI, body.id)
      await this.addDefaultCompanyServiceProfile(session, network, company, dataAPI, body.id)
    }
    catch (err) {
      appLogger.log(`Failed to add ancillary data to remote host: ${err}`)
      throw err
    }
  }

  async addDefaultCompanyAdminUser (session, network, company, dataAPI, organizationId) {
    var creds = await this.getCompanyAccount(dataAPI, network, company.id, true)

    const opts = {
      method: 'POST',
      url: '/users',
      body: this.buildDefaultOrgUser(creds, organizationId)
    }

    let body = await appLogger.logOnThrow(
      () => request(opts, network, session),
      err => `Error on create user for company ${company.name}: ${err}`
    )
    appLogger.log(body)

    await dataAPI.putProtocolDataForKey(network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(company.id, 'coUsrId'),
      body.id
    )
  }

  async addDefaultCompanyServiceProfile (session, network, company, dataAPI, organizationId) {
    var networkServerId = await this.getANetworkServerID(session, network)
    const opts = {
      method: 'POST',
      url: '/service-profiles',
      body: this.buildDefaultServiceProfile(networkServerId, organizationId)
    }
    const body = await appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error creating default Service Profile: ${err}`
    )

    // Save the ServiceProfile ID from the remote network.
    await dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(company.id, 'coSPId'),
      body.id
    )
    // TODO: Remove this HACK.  Should not store the service profile locally
    // in case it gets changed on the remote server.
    await dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(company.id, 'coSPNwkId'),
      networkServerId
    )
  }

  async getANetworkServerID (session, network) {
    appLogger.log('LoRaOpenSource: getANetworkServerID')
    const opts = { url: '/network-servers?limit=20&offset=0' }
    const body = await appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get Network Server: ${err}`
    )
    const { result: nsList } = body
    if (!nsList.length) {
      appLogger.log('Empty list of Network Servers returned')
      throw httpError.NotFound()
    }
    appLogger.log(nsList)
    return nsList[0].id
  }

  getNetworkServerById (session, network, networkServerId) {
    const opts = { url: `/network-servers/${networkServerId}` }
    return appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get Network Server: ${err}`
    )
  }

  getDeviceProfileById (session, network, dpId) {
    const opts = { url: `/device-profiles/${dpId}` }
    return appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get Device Profile ${dpId}: ${err}`
    )
  }

  getRemoteDeviceById (session, network, deviceId) {
    const opts = { url: `/devices/${deviceId}` }
    return appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get Device ${deviceId}: ${err}`
    )
  }

  async getRemoteDeviceKey (session, network, device) {
    const opts = { url: `/devices/${device.device.devEUI}/keys` }
    const body = await appLogger.logOnThrow(
      () => this.request(opts, network, session),
      err => `Error on get keys for device ${device.device.id}: ${err}`
    )
    device.device.deviceKeys = body.deviceKeys
    return device
  }

  buildOrg (company) {
    return {
      organization: {
        name: company.name,
        displayName: company.name,
        canHaveGateways: false
      }
    }
  }

  buildDefaultOrgUser (creds, organizationID) {
    return {
      password: creds.password,
      organizations: [
        { isAdmin: true, organizationID }
      ],
      user: {
        username: creds.username,
        isActive: true,
        isAdmin: false,
        sessionTTL: 0,
        email: 'fake@emailaddress.com',
        note: 'Created by and for LPWAN Server'
      }
    }
  }

  buildDefaultServiceProfile (networkServerID, organizationID) {
    return {
      serviceProfile: {
        name: 'defaultForLPWANServer',
        networkServerID,
        organizationID,
        addGWMetadata: true,
        devStatusReqFreq: 1,
        dlBucketSize: 0,
        ulRate: 100000,
        dlRate: 100000,
        dlRatePolicy: 'DROP',
        ulRatePolicy: 'DROP',
        drMax: 3,
        drMin: 0,
        reportDevStatusBattery: true,
        reportDevStatusMargin: true
      }
    }
  }
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
