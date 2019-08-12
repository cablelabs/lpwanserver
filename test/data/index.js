const R = require('ramda')

const applicationTemplates = {
  default ({ name, companyId, networkTypeId, reportingProtocolId }) {
    const description = `${name} Description`
    const networkSettings = { name, description }
    return {
      app: {
        companyId,
        name,
        description,
        baseUrl: 'http://localhost:5086',
        reportingProtocolId
      },
      networkSettings,
      appNTL: {
        'applicationId': 0,
        networkTypeId,
        networkSettings
      }
    }
  }
}

const deviceTemplates = {
  weatherNode ({ name, companyId, devEUI, networkTypeId }) {
    return {
      deviceProfile: {
        networkTypeId,
        companyId,
        name: `LoRaWeatherNode_${name}`,
        description: 'GPS Node that works with LoRa',
        networkSettings: {
          name: `LoRaWeatherNode_${name}`,
          macVersion: '1.0.0',
          regParamsRevision: 'A',
          supportsJoin: true
        }
      },
      device: {
        applicationId: '',
        name,
        description: 'GPS Node Model 001',
        deviceModel: 'Mark1'
      },
      deviceNTL: {
        deviceId: '',
        networkTypeId,
        deviceProfileId: '',
        networkSettings: {
          devEUI,
          name,
          deviceKeys: {
            appKey: '11223344556677889900112233443311'
          }
        }
      }
    }
  }
}

module.exports = {
  deviceTemplates,
  applicationTemplates
}
