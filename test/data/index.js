const applicationTemplates = {
  default ({ name, networkTypeId, reportingProtocolId }) {
    const description = `${name} Description`
    return {
      app: {
        name,
        description,
        baseUrl: 'http://localhost:5086',
        reportingProtocolId
      },
      appNTL: {
        'applicationId': 0,
        networkTypeId
      }
    }
  }
}

const deviceTemplates = {
  weatherNode ({ name, devEUI, networkTypeId }) {
    return {
      deviceProfile: {
        networkTypeId,
        name: `LoRaWeatherNode_${name}`,
        description: 'GPS Node that works with LoRa',
        networkSettings: {
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
