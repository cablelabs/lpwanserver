const R = require('ramda')

const applicationTemplates = {
  default ({ name, companyId }) {
    const description = `${name} Description`
    const networkSettings = { name, description }
    return {
      app: {
        companyId,
        name,
        description,
        baseUrl: 'http://localhost:5086',
        reportingProtocolId: 1
      },
      networkSettings,
      appNTL: {
        'applicationId': 0,
        'networkTypeId': 1,
        'networkSettings': networkSettings
      }
    }
  }
}

const deviceTemplates = {
  weatherNode ({ name, companyId, devEUI }) {
    return {
      deviceProfile: {
        networkTypeId: 1,
        companyId,
        name: 'LoRaWeatherNode',
        description: 'GPS Node that works with LoRa',
        networkSettings: {
          name: 'LoRaWeatherNode',
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
        networkTypeId: 1,
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