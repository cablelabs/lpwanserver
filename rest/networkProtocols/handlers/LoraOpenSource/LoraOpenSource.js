const NetworkProtocol = require('../../classes/NetworkProtocol')
const R = require('ramda')
const appLogger = require('../../lib/appLogger.js')
const httpError = require('http-errors')
const ApiClient = require('./client')
const nconf = require('nconf')

module.exports = class LoraOpenSource extends NetworkProtocol {
  constructor () {
    super()
    this.client = new ApiClient()
    this.activeApplicationNetworkProtocols = {}
  }

  async connect (network, loginData) {
    return this.client.login(network, loginData)
  }

  async disconnect () {
  }

  async test (network, session) {
    if (!network.securityData.authorized) {
      throw httpError.Unauthorized()
    }
    await this.client.listApplications(network, session, { limit: 20, offset: 0 })
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

  async addCompany (network, session, companyId, dataAPI) {
    let company = await dataAPI.getCompanyById(companyId)
    let org = await this.client.createOrganization(network, session, {
      name: company.name,
      displayName: company.name,
      canHaveGateways: false
    })
    appLogger.log(org)

    await dataAPI.putProtocolDataForKey(network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(company.id, 'coNwkId'),
      org.id
    )

    try {
      await this.addDefaultOrgAdminUser(network, session, company, dataAPI, org.id)
      await this.addDefaultOrgServiceProfile(network, session, company, dataAPI, org.id)
    }
    catch (err) {
      appLogger.log(`Failed to add ancillary data to remote host: ${err}`)
      throw err
    }
  }

  async addDefaultOrgAdminUser (network, session, company, dataAPI, organizationId) {
    var creds = await this.getCompanyAccount(dataAPI, network, company.id, true)
    const { id: userId } = await this.client.createUser(network, session, {
      password: creds.password,
      organizations: [
        { isAdmin: true, organizationID: organizationId }
      ],
      username: creds.username,
      isActive: true,
      isAdmin: false,
      sessionTTL: 0,
      email: 'fake@emailaddress.com',
      note: 'Created by and for LPWAN Server'
    })

    await dataAPI.putProtocolDataForKey(network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(company.id, 'coUsrId'),
      userId
    )
  }

  async addDefaultOrgServiceProfile (network, session, company, dataAPI, organizationId) {
    var networkServerId = await this.getANetworkServerID(network, session)
    const body = await this.client.createServiceProfile(network, session, {
      name: 'defaultForLPWANServer',
      networkServerID: networkServerId,
      organizationID: organizationId,
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
    })

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

  async getANetworkServerID (network, session) {
    appLogger.log('LoRaOpenSource: getANetworkServerID')
    const { result: nsList } = await this.client.listNetworkServers(network, session, { limit: 20, offset: 0 })
    if (!nsList.length) {
      appLogger.log('Empty list of Network Servers returned')
      throw httpError.NotFound()
    }
    appLogger.log(nsList)
    return nsList[0].id
  }

  getDeviceProfileById (network, session, dpId) {
    return this.client.loadDeviceProfile(network, session, dpId)
  }

  getRemoteDeviceById (network, session, deviceId) {
    return this.client.loadDevice(network, session, deviceId)
  }

  async getServiceProfileById (network, session, serviceProfileId) {
    return this.client.loadServiceProfile(network, session, serviceProfileId)
  }

  async getServiceProfileForOrg (network, session, orgId, companyId, dataAPI) {
    const [serviceProfile] = await this.client.listServiceProfiles(network, session, {
      organizationID: orgId,
      limit: 20,
      offset: 0
    })
    if (!serviceProfile) return
    appLogger.log(serviceProfile, 'warn')
    // TODO: Remove this HACK.  Should not store the service profile locally
    //       in case it gets changed on the remote server.
    await dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'coSPNwkId'),
      serviceProfile.networkServerID
    )
    await dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'coSPId'),
      serviceProfile.id
    )
  }

  async getCompany (network, session, companyId, dataAPI) {
    // Get the remote company id.
    const company = await dataAPI.getCompanyById(companyId)
    let orgId = appLogger.logOnThrow(
      () => dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(company.id, 'coNwkId')
      ),
      err => `Company ${company.name} does not have a key for the remote network.  Company has not yet been created.  ${err}`
    )
    return this.client.loadCompany(network, session, orgId)
  }

  async updateCompany (network, session, companyId, dataAPI) {
    // Get the remote company id.
    const company = await dataAPI.getCompanyById(companyId)
    let orgId = await appLogger.logOnThrow(
      () => dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(company.id, 'coNwkId')
      ),
      err => `Company ${company.name} does not have a key for the remote network.  Company has not yet been created.  ${err}`
    )
    await this.client.replaceOrganization(network, session, {
      'id': orgId,
      'name': company.name,
      'displayName': company.name,
      canHaveGateways: false
    })
  }

  async deleteCompany (network, session, companyId, dataAPI) {
    // Get the remote company id.
    let orgId
    let userId
    try {
      orgId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(companyId, 'coNwkId')
      )
      // Get the admin user's id, too.
      userId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(companyId, 'coUsrId')
      )
    }
    catch (err) {
      // No data.
      appLogger.log(`Company ${companyId} does not have a key for the remote network.  Company has not yet been created.  ${err}`)
      throw err
    }
    await appLogger.logOnThrow(
      () => this.client.deleteUser(network, session, userId),
      err => `Error on delete admin user for company ${companyId}: ${err}`
    )
    await this.client.deleteOrganization(network, session, orgId)
    // Clear the data for this company from the
    // protocolData store.
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'kd')
    )
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'coUsrId')
    )
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'coNwkId')
    )
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'sd')
    )
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'coSPId')
    )
    // TODO: Remove this HACK.  Should not store the
    // service profile locally in case it gets changed on
    // the remote server.
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(companyId, 'coSPNwkId')
    )
  }

  async pushNetwork (network, session, dataAPI, modelAPI) {
    await Promise.all([
      ...this.pushDeviceProfiles(network, session, modelAPI, dataAPI),
      ...this.pushApplications(network, session, modelAPI, dataAPI)
    ])
    await this.pushDevices(network, session, modelAPI, dataAPI)
  }

  async pushApplications (network, session, modelAPI, dataAPI) {
    let apps = await modelAPI.applications.retrieveApplications()
    await Promise.all(apps.map(x => this.pushApplication(network, session, x, dataAPI, false)))
  }

  async pushApplication (network, session, app, dataAPI, update = true) {
    let appNetworkId
    try {
      appNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(app.id, 'appNwkId')
      )
      if (update && appNetworkId) {
        return this.updateApplication(network, session, app.id, dataAPI)
      }
      else if (appNetworkId) {
        appLogger.log('Ignoring Application  ' + app.id + ' already on network ' + network.name)
        return { localApplication: app.id, remoteApplication: appNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      appNetworkId = await this.addApplication(network, session, app.id, dataAPI)
      appLogger.log('Added application ' + app.id + ' to network ' + network.name)
      return { localApplication: app.id, remoteApplication: appNetworkId }
    }
  }

  async pushDeviceProfiles (network, session, modelAPI, dataAPI) {
    let dps = await modelAPI.deviceProfiles.retrieveDeviceProfiles()
    await Promise.all(dps.map(x => this.pushDeviceProfile(network, session, x, dataAPI, false)))
  }

  async pushDeviceProfile (network, session, deviceProfile, dataAPI, update = true) {
    let dpNetworkId
    try {
      dpNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeDeviceProfileDataKey(deviceProfile.id, 'dpNwkId')
      )
      if (update && dpNetworkId) {
        return this.updateDeviceProfile(network, session, deviceProfile.id, dataAPI)
      }
      else if (dpNetworkId) {
        appLogger.log('Ignoring DeviceProfile  ' + deviceProfile.id + ' already on network ' + network.name)
        return { localDeviceProfile: deviceProfile.id, remoteDeviceProfile: dpNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      dpNetworkId = await this.addDeviceProfile(network, session, deviceProfile.id, dataAPI)
      appLogger.log('Added DeviceProfile ' + deviceProfile.id + ' to network ' + network.name)
      return { localDeviceProfile: deviceProfile.id, remoteDeviceProfile: dpNetworkId }
    }
  }

  async pushDevices (network, session, modelAPI, dataAPI) {
    let devices = await modelAPI.deviceProfiles.retrieveDevices()
    await Promise.all(devices.map(x => this.pushDevice(network, session, x, dataAPI, false)))
  }

  async pushDevice (network, session, device, dataAPI, update = true) {
    let devNetworkId
    try {
      devNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeDeviceDataKey(device.id, 'devNwkId')
      )
      if (update && devNetworkId) {
        return this.updateDeviceProfile(network, session, device.id, dataAPI)
      }
      else if (devNetworkId) {
        appLogger.log('Ignoring Device  ' + device.id + ' already on network ' + network.name)
        return { localDevice: device.id, remoteDevice: devNetworkId }
      }
      throw new Error('Bad things in the Protocol Table')
    }
    catch (err) {
      devNetworkId = await this.addDeviceProfile(network, session, device.id, dataAPI)
      appLogger.log('Added Device ' + device.id + ' to network ' + network.name)
      return { localDevice: device.id, remoteDevice: devNetworkId }
    }
  }

  async pullNetwork (network, session, dataAPI, modelAPI) {
    const companyNtl = await this.setupOrganization(network, session, modelAPI, dataAPI)
    const [pulledDevProfiles, pulledApps] = await Promise.all([
      this.pullDeviceProfiles(network, session, modelAPI, companyNtl, dataAPI),
      this.pullApplications(network, session, modelAPI, dataAPI, companyNtl)
    ])
    await Promise.all(pulledApps.reduce((acc, x) => {
      acc.push(this.pullDevices(network, session, x.remoteApplication, x.localApplication, pulledDevProfiles, modelAPI, dataAPI))
      acc.push(this.pullIntegrations(network, session, x.remoteApplication, x.localApplication, pulledDevProfiles, modelAPI, dataAPI))
      return acc
    }, []))
  }

  async setupOrganization (network, session, modelAPI, dataAPI) {
    let company = await modelAPI.companies.retrieveCompany(2)
    let companyNtl = await dataAPI.getCompanyNetworkType(company.id, network.networkType.id)
    let lora1NetworkSettings = { network: network.id }
    if (!companyNtl) {
      companyNtl = await modelAPI.companyNetworkTypeLinks.createRemoteCompanyNetworkTypeLink(company.id, network.networkType.id, {})
      companyNtl.networkSettings = JSON.parse(companyNtl.networkSettings)
    }
    appLogger.log(company)
    appLogger.log(companyNtl)
    const { result } = await appLogger.logOnThrow(
      () => this.client.listOrganizations(network, session, { search: company.name, limit: 1 }),
      err => `Error getting operator ${company.name} from network ${network.name}: ${err}`
    )
    appLogger.log(result)
    if (!result.length) {
      appLogger.log('Adding company to network ', 'warn')
      let networkSettings = await this.addCompany(network, session, company.id, dataAPI)
      appLogger.log(networkSettings)
      lora1NetworkSettings.serviceProfileId = networkSettings.serviceProfileID
      lora1NetworkSettings.networkServerId = networkSettings.networkServerID
      appLogger.log(companyNtl)
      return companyNtl
    }
    let organization = result[0]
    appLogger.log('Setting up company to match network Organization', 'warn')
    let networkSettings = await this.getServiceProfileForOrg(network, session, organization.id, company.id, dataAPI)
    appLogger.log(networkSettings, 'warn')
    dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(company.id, 'coNwkId'),
      organization.id
    )
    const networkServer = await this.client.loadNetworkServer(network, session, networkSettings.networkServerID)
    appLogger.log(networkServer, 'warn')
    lora1NetworkSettings.serviceProfileId = networkSettings.id
    lora1NetworkSettings.networkServerId = networkSettings.networkServerID
    lora1NetworkSettings.organizationId = organization.id
    lora1NetworkSettings.networkId = network.id

    companyNtl.networkSettings.serviceProfile = { region: networkServer.region }
    companyNtl.networkSettings[network.name] = lora1NetworkSettings
    appLogger.log(companyNtl, 'warn')
    await modelAPI.companyNetworkTypeLinks.updateRemoteCompanyNetworkTypeLink(companyNtl)
    return lora1NetworkSettings
  }

  async pullDeviceProfiles (network, session, modelAPI, companyNtl, dataAPI) {
    const { result } = await this.client.listDeviceProfiles(network, session, {
      organizationID: companyNtl.organizationId,
      limit: 9999,
      offset: 0
    })
    return Promise.all(result.map(x => this.addRemoteDeviceProfile(network, session, x.id, modelAPI, dataAPI)))
  }

  async addRemoteDeviceProfile (network, session, remoteDevProfileId, modelAPI, dataAPI) {
    const remoteDeviceProfile = await this.client.loadDeviceProfile(network, session, remoteDevProfileId)
    appLogger.log('Adding ' + remoteDeviceProfile.name)
    appLogger.log(remoteDeviceProfile)
    const { totalCount, records } = await modelAPI.deviceProfiles.retrieveDeviceProfiles({ search: remoteDeviceProfile.name })
    if (totalCount > 0) {
      let localDp = records[0]
      appLogger.log(localDp.name + ' already exists')
      dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeDeviceProfileDataKey(localDp.id, 'dpNwkId'),
        remoteDeviceProfile.id
      )
      return {
        localDeviceProfile: localDp.id,
        remoteDeviceProfile: remoteDeviceProfile.id
      }
    }
    appLogger.log('creating ' + remoteDeviceProfile.name)
    let networkSpecificDeviceProfileInformation = this.normalizeDeviceProfileData(remoteDeviceProfile)
    appLogger.log(networkSpecificDeviceProfileInformation, 'error')
    let localDp = await modelAPI.deviceProfiles.createRemoteDeviceProfile(
      network.networkType.id,
      2,
      remoteDeviceProfile.name,
      'Device Profile managed by LPWAN Server, perform changes via LPWAN',
      networkSpecificDeviceProfileInformation
    )
    appLogger.log(localDp)
    dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeDeviceProfileDataKey(localDp.id, 'dpNwkId'),
      remoteDeviceProfile.deviceProfile.id
    )
    return {
      localDeviceProfile: localDp.id,
      remoteDeviceProfile: remoteDeviceProfile.id
    }
  }

  async pullApplications (network, session, modelAPI, dataAPI, companyNtl) {
    let { result: apps } = await this.client.listApplications(network, session, {
      organizationID: companyNtl.organizationId,
      limit: 9999,
      offset: 0
    })
    return Promise.all(apps.map(app => this.addRemoteApplication(session, network, app.id, modelAPI, dataAPI)))
  }

  async addRemoteApplication (network, session, remoteAppId, modelAPI, dataAPI) {
    const remoteApp = await this.client.localApplication(network, session, remoteAppId)
    let localAppsResult = await modelAPI.applications.retrieveApplications({ search: remoteApp.name })
    let localApp
    if (localAppsResult.totalCount > 0) {
      localApp = localAppsResult.records[0]
      appLogger.log(localApp.name + ' already exists')
    }
    else {
      localApp = await modelAPI.applications.createApplication(remoteApp.name, remoteApp.description, 2, 1, 'http://set.me.to.your.real.url:8888')
      appLogger.log('Created ' + localApp.name)
    }
    let localAppNtlResult = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({ applicationId: localApp.id })
    if (localAppNtlResult.totalCount > 0) {
      appLogger.log(localApp.name + ' link already exists')
    }
    else {
      let networkSpecificApplicationInformation = this.normalizeApplicationData(remoteApp)
      appLogger.log(networkSpecificApplicationInformation)
      let localAppNtl = await modelAPI.applicationNetworkTypeLinks.createRemoteApplicationNetworkTypeLink(localApp.id, network.networkType.id, networkSpecificApplicationInformation, localApp.company.id)
      appLogger.log(localAppNtl)
      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(localAppNtl.id, 'appNwkId'),
        remoteApp.application.id
      )
    }
    return { localApplication: localApp.id, remoteApplication: remoteApp.id }
  }

  async pullDevices (network, session, remoteAppId, localAppId, dpMap, modelAPI, dataAPI) {
    const remoteDevices = await this.client.listDevices(network, session, {
      limit: 9999,
      offset: 0,
      applicationID: remoteAppId
    })
    return Promise.all(remoteDevices.map(device => this.addRemoteDevice(network, session, device.id, localAppId, dpMap, modelAPI, dataAPI)))
  }

  async addRemoteDevice (network, session, remoteDeviceId, localAppId, dpMap, modelAPI, dataAPI) {
    const remoteDevice = await this.client.loadDevice(network, session, remoteDeviceId)
    appLogger.log('Adding ' + remoteDevice.name)
    appLogger.log(remoteDevice)
    let deviceProfileId = dpMap.find(o => o.remoteDeviceProfile === remoteDevice.deviceProfileID)
    let deviceProfile = await dataAPI.getDeviceProfileById(deviceProfileId.localDeviceProfile)
    if (deviceProfile.supportsJoin) {
      remoteDevice.deviceKeys = await this.client.loadDeviceKeys(network, session, remoteDevice)
    }
    else {
      remoteDevice.deviceActivation = await this.client.loadDeviceActivation(network, session, remoteDevice)
    }

    let localDevResult = await modelAPI.devices.retrieveDevices({ search: remoteDevice.name })
    let localDevice
    if (localDevResult.totalCount > 0) {
      localDevice = localDevResult.records[0]
      appLogger.log(localDevice.name + ' already exists')
    }
    else {
      appLogger.log('creating ' + remoteDevice.name)
      localDevice = await modelAPI.devices.createDevice(remoteDevice.name, remoteDevice.description, localAppId)
      appLogger.log('Created ' + localDevice.name)
    }
    let localDevNtlResult = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({ deviceId: localDevice.id })
    if (localDevNtlResult.totalCount > 0) {
      appLogger.log(localDevice.name + ' link already exists')
    }
    else {
      appLogger.log('creating Network Link for ' + localDevice.name)
      let normalizedDeviceSettings = this.normalizeDeviceData(remoteDevice)
      let localDevNtl = await modelAPI.deviceNetworkTypeLinks.createRemoteDeviceNetworkTypeLink(localDevice.id, network.networkType.id, deviceProfileId.localDeviceProfile, normalizedDeviceSettings, 2)
      appLogger.log(localDevNtl)
    }
    dataAPI.putProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeDeviceDataKey(localDevice.id, 'devNwkId'),
      remoteDevice.devEUI
    )
    return localDevice.id
  }

  async pullIntegrations (network, session, remoteAppId, localAppId, dpMap, modelAPI, dataAPI) {
    const integration = await this.client.loadApplicationIntegration(network, session, remoteAppId, 'http')
    appLogger.log(integration, 'warn')
    const deliveryURL = `api/ingest/${localAppId}/${network.id}`
    const reportingUrl = `${nconf.get('base_url')}${deliveryURL}`
    if (integration.dataUpURL === reportingUrl) return
    await modelAPI.applications.updateApplication({ id: localAppId, baseUrl: integration.uplinkDataURL })
    await this.client.replaceApplicationIntegration(network, session, remoteAppId, {
      ackNotificationURL: reportingUrl,
      uplinkDataURL: reportingUrl,
      errorNotificationURL: reportingUrl,
      id: integration.id,
      joinNotificationURL: reportingUrl
    })
  }

  async addApplication (network, session, appId, dataAPI) {
    var localApp
    var applicationData
    var coNetworkId
    var coSPId
    try {
      // Get the local application data.
      localApp = await dataAPI.getApplicationById(appId)
      applicationData = await dataAPI.getApplicationNetworkType(appId, network.networkType.id)
      coNetworkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(localApp.company.id, 'coNwkId')
      )
      coSPId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeCompanyDataKey(localApp.company.id, 'coSPId')
      )
      const body = await this.client.createApplication(network, session, this.deNormalizeApplicationData(
        applicationData.networkSettings,
        coSPId,
        coNetworkId,
        localApp
      ))
      // Save the application ID from the remote network.
      await dataAPI.putProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(localApp.id, 'appNwkId'),
        body.id
      )
    }
    catch (err) {
      appLogger.log('Failed to get required data for addApplication: ' + err)
      throw err
    }
  }

  async getApplication (network, session, appId, dataAPI) {
    var appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )
    return this.client.loadApplication(network, session, appNetworkId)
  }

  async updateApplication (network, session, appId, dataAPI) {
    // Get the application data.
    var localApp = await dataAPI.getApplicationById(appId)
    var coNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(localApp.company.id, 'coNwkId')
    )
    var appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )
    var applicationData = await dataAPI.getApplicationNetworkType(appId, network.networkType.id)
    let coSPId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeCompanyDataKey(localApp.company.id, 'coSPId')
    )
    let reqBody = this.deNormalizeApplicationData(
      applicationData.networkSettings,
      coSPId,
      coNetworkId,
      localApp
    )

    reqBody.id = appNetworkId

    // Optional data
    if (applicationData && applicationData.networkSettings) {
      let props = ['isABP', 'isClassC', 'relaxFCnt', 'rXDelay', 'rX1DROffset', 'rXWindow', 'rX2DR', 'aDRInterval', 'installationMargin', 'payloadDecoderScript', 'payloadEncoderScript']
      Object.assign(reqBody, R.pick(props, applicationData.networkSettings))
      if (applicationData.networkSettings.payloadCodec && applicationData.networkSettings.payloadCodec !== 'NONE') {
        reqBody.payloadCodec = applicationData.networkSettings.payloadCodec
      }
    }
    await this.client.replaceApplication(network, session, reqBody)
  }

  async deleteApplication (network, session, appId, dataAPI) {
    var appNetworkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )
    await this.client.deleteApplication(network, session, appNetworkId)
    await dataAPI.deleteProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )
  }

  async startApplication (network, session, appId, dataAPI) {
    // Create a new endpoint to get POSTs, and call the deliveryFunc.
    // Use the local applicationId and the networkId to create a unique
    // URL.
    var deliveryURL = 'api/ingest/' + appId + '/' + network.id
    var reportingAPI = await dataAPI.getReportingAPIByApplicationId(appId)

    // Link the reporting API to the application and network.
    this.activeApplicationNetworkProtocols['' + appId + ':' + network.id] = reportingAPI

    // Set up the Forwarding with LoRa App Server
    var appNwkId = await dataAPI.getProtocolDataForKey(
      network.id,
      network.networkProtocol.id,
      makeApplicationDataKey(appId, 'appNwkId')
    )

    await this.client.createApplicationIntegration(network, session, appNwkId, {
      id: 'http',
      dataUpURL: nconf.get('base_url') + deliveryURL
    })
  }

  async stopApplication (network, session, appId, dataAPI) {
    // Can't delete if not running on the network.
    if (this.activeApplicationNetworkProtocols['' + appId + ':' + network.id] === undefined) {
      // We don't think the app is running on this network.
      appLogger.log('Application ' + appId + ' is not running on network ' + network.id)
      throw httpError.NotFound()
    }
    let appNwkId
    try {
      appNwkId = await dataAPI.getProtocolDataForKey(
        network.id,
        network.networkProtocol.id,
        makeApplicationDataKey(appId, 'appNwkId')
      )
    }
    catch (err) {
      appLogger.log('Cannot delete application data forwarding for application ' +
      appId +
        ' and network ' +
        network.name +
        ': ' + err)
      throw err
    }
    await this.client.deleteApplicationIntegration(network, session, appNwkId, 'http')
    delete this.activeApplicationNetworkProtocols['' + appId + ':' + network.id]
  }

  async passDataToApplication (network, appId, data, dataAPI) {
    // Get the reporting API, reject data if not running.
    var reportingAPI = this.activeApplicationNetworkProtocols['' + appId + ':' + network.id]

    if (!reportingAPI) {
      appLogger.log('Rejecting received data from networkId ' + network.id +
        ' for applicationId ' + appId +
        '. The appliction is not in a running state.  Data = ' +
        JSON.stringify(data)
      )
      throw new Error('Application not running')
    }
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
        data.devieInfo = R.pick(['name', 'description'], device)
        data.deviceInfo.model = device.deviceModel
      }
    }

    let app = await dataAPI.getApplicationById(appId)

    data.applicationInfo = { name: app.name }
    data.networkInfo = { name: network.name }
    await reportingAPI.report(data, app.baseUrl, app.name)
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
