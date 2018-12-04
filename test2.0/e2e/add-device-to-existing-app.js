let assert = require('assert')
let chai = require('chai')
let chaiHttp = require('chai-http')
let app = require('../../restApp.js')
let should = chai.should()
let setup = require('./setup.js')
let appLogger = require('../../rest/lib/appLogger.js')
let request = require('request')

chai.use(chaiHttp)
let server = chai.request(app).keepOpen()

describe.skip('E2E Test for Creating a Device on an existing Application Use Case #190', () => {
  let adminToken
  let appId1
  let anlId1
  let dpId1
  let deviceId1
  let deviceId2
  let dnlId1
  let dnlId2
  let remoteDevicProfile
  let remoteDevicProfile2

  let lora = {
    loraV1: {
      protocolId: '',
      networkId: '',
      apps: []
    },
    loraV2: {
      protocolId: '',
      networkId: '',
      apps: []
    },
    ttn: {
      protocolId: '',
      networkId: '',
      apps: []

    }
  }

  before((done) => {
    setup.start()
      .then(() => {
        // wait on the  postgress to come up
        setTimeout(done, 10000)
      })
      .catch((err) => {
        done(err)
      })
  })
  describe('Verify Login and Administration of Users Works', () => {
    it('Admin Login to LPWan Server', (done) => {
      server
        .post('/api/sessions')
        .send({'login_username': 'admin', 'login_password': 'password'})
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          adminToken = res.text
          done()
        })
    })
  })
  describe('Setup Networks', () => {
    describe('Setup Lora 1.0 Network', () => {
      it('Verify LoraOS 1.0 Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=LoRa Server&networkProtocolVersion=1.0')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            let result = JSON.parse(res.text)
            appLogger.log(result)
            result.records.should.be.instanceof(Array)
            result.records.should.have.length(1)
            result.totalCount.should.equal(1)
            result.records[0].should.have.property('networkProtocolVersion')
            result.records[0].networkProtocolVersion.should.equal('1.0')
            lora.loraV1.protocolId = result.records[0].id
            done()
          })
      })
      it('Create the Local LoraOS 1.0 Network', (done) => {
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({
            'name': 'LocalLoraOS1_0',
            'networkProviderId': -1,
            'networkTypeId': 1,
            'baseUrl': 'https://lora_appserver1:8080/api',
            'networkProtocolId': lora.loraV1.protocolId,
            'securityData': {authorized: false, 'username': 'admin', 'password': 'admin'}
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            let network = JSON.parse(res.text)
            appLogger.log(network)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            lora.loraV1.networkId = network.id
            done()
          })
      })

      it('Get Network', (done) => {
        server
          .get('/api/networks/' + lora.loraV1.networkId)
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send()
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            let network = JSON.parse(res.text)
            network.name.should.equal('LocalLoraOS1_0')
            network.baseUrl.should.equal('https://lora_appserver1:8080/api')
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
      })
    })
    describe('Setup Lora 2.0 Network', () => {
      it('Verify LoraOS 2.0 Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=LoRa Server&networkProtocolVersion=2.0')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            var result = JSON.parse(res.text)
            appLogger.log(result)
            result.records.should.be.instanceof(Array)
            result.records.should.have.length(1)
            result.totalCount.should.equal(1)
            result.records[0].should.have.property('networkProtocolVersion')
            result.records[0].networkProtocolVersion.should.equal('2.0')
            lora.loraV2.protocolId = result.records[0].id
            done()
          })
      })
      it('Create the Local LoraOS 2.0 Network', (done) => {
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({
            'name': 'LocalLoraOS2_0',
            'networkProviderId': -1,
            'networkTypeId': 1,
            'baseUrl': 'https://lora_appserver:8080/api',
            'networkProtocolId': lora.loraV2.protocolId,
            'securityData': {authorized: false, 'username': 'admin', 'password': 'admin'}
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            var network = JSON.parse(res.text)
            appLogger.log(network)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            lora.loraV2.networkId = network.id
            done()
          })
      })

      it('Get Network', (done) => {
        server
          .get('/api/networks/' + lora.loraV2.networkId)
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send()
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            var network = JSON.parse(res.text)
            network.name.should.equal('LocalLoraOS2_0')
            network.baseUrl.should.equal('https://lora_appserver:8080/api')
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
      })
    })

  })
  describe('Create Application', () => {
    let application =
      {
        'companyId': 2,
        'name': 'MyEnterpriseApp',
        'description': 'Ugh, enterprise apps',
        'baseUrl': 'http://localhost:5086',
        'reportingProtocolId': 1
      }
    let applicationNetworkSettings = {
      'description': 'Create-App-Test-App',
      'name': 'CATA'
    }
    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(application)
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          appId1 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/applications/' + appId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let appObj = JSON.parse(res.text)
          done()
        })
    })
    it('Create Network Type Links for Application', function (done) {
      server
        .post('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'applicationId': appId1,
          'networkTypeId': 1,
          'networkSettings': applicationNetworkSettings
        })
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          anlId1 = ret.id
          done()
        })
    })
    it('should return 200 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let appObj = JSON.parse(res.text)
          console.log(appObj)
          remoteId = appObj.id
          done()
        })
    })
  })
  describe('Create Device Profile for Application', () => {
    it('Create Device Profile', function (done) {
      server
        .post('/api/deviceProfiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'networkTypeId': 1,
          'companyId': 2,
          'name': 'LoRaWeatherNode',
          'description': 'GPS Node that works with LoRa',
          'networkSettings': {
            'name': 'LoRaWeatherNode',
            'macVersion': '1.0.0',
            'regParamsRevision': 'A',
            'supportsJoin': true }})
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          dpId1 = ret.id
          done()
        })
    })
    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceProfiles/' + dpId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let dpObj = JSON.parse(res.text)
          dpObj.name.should.equal('LoRaWeatherNode')
          dpObj.description.should.equal('GPS Node that works with LoRa')
          dpObj.networkTypeId.should.equal(1)
          dpObj.companyId.should.equal(2)
          done()
        })
    })
  })
  describe('Create Device for Application', () => {
    it('POST Device', function (done) {
      server
        .post('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': appId1,
          'name': 'MGRQD003',
          'description': 'GPS Node Model 003',
          'deviceModel': 'Mark2' })
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          deviceId1 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/devices/' + deviceId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let devObj = JSON.parse(res.text)
          devObj.name.should.equal('MGRQD003')
          devObj.description.should.equal('GPS Node Model 003')
          devObj.deviceModel.should.equal('Mark2')
          done()
        })
    })
    it('Create Device NTL', function (done) {
      server
        .post('/api/deviceNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'deviceId': deviceId1,
          'networkTypeId': 1,
          'deviceProfileId': dpId1,
          'networkSettings': {
            'devEUI': '0080000000000102',
            name: 'MGRQD003',
            deviceKeys: {
              'appKey': '11223344556677889900112233445566'
            }
          }
        })
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          console.log(dnlObj)
          dnlId1 = dnlObj.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceNetworkTypeLinks/' + dnlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          dnlObj.deviceId.should.equal(deviceId1)
          dnlObj.networkTypeId.should.equal(1)
          done()
        })
    })
  })
  describe('Verify LoRaServer V1 has application', function () {
    let baseUrl = 'https://lora_appserver1:8080/api'
    let loraKey = ''
    it('Get Lora Session', function (done) {
      let options = {}
      options.method = 'POST'
      options.url = baseUrl + '/internal/login'
      options.headers = {'Content-Type': 'application/json'}
      options.json = {username: 'admin', password: 'admin'}
      options.agentOptions = {'secureProtocol': 'TLSv1_2_method', 'rejectUnauthorized': false}
      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error on signin: ' + error)
          done(error)
        }
        else if (response.statusCode >= 400 || response.statusCode === 301) {
          appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
          done(response.statusCode)
        }
        else if (!body.jwt) {
          done(new Error('No token'))
        }
        else {
          loraKey = body.jwt
          done()
        }
      })
    })
    it('Verify the Lora Server Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/applications/29'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app.should.have.property('id')
          app.should.have.property('name')
          app.should.have.property('description')
          app.should.have.property('organizationID')
          app.should.have.property('serviceProfileID')
          app.should.have.property('payloadCodec')
          app.should.have.property('payloadEncoderScript')
          app.should.have.property('payloadDecoderScript')
          app.name.should.equal('CATA')
          done()
        }
      })
    })
    it('Verify the Lora Server Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles?limit=3'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app.should.have.property('totalCount')
          app.totalCount.should.equal('3')
          app.should.have.property('result')
          app.result.length.should.equal(3)
          app.result[2].should.have.property('deviceProfileID')
          remoteDevicProfile = app.result[2].deviceProfileID
          done()
        }
      })
    })
    it('Verify the Lora Server Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles/' + remoteDevicProfile
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app.should.have.property('name')
          app.name.should.equal('LoRaWeatherNode')
          app.should.have.property('organizationID')
          app.should.have.property('networkServerID')
          app.should.have.property('createdAt')
          app.should.have.property('updatedAt')
          app.should.have.property('deviceProfile')
          app.deviceProfile.should.have.property('macVersion')
          app.deviceProfile.should.have.property('regParamsRevision')
          app.deviceProfile.macVersion.should.equal('1.0.0')
          app.deviceProfile.regParamsRevision.should.equal('A')

          done()
        }
      })
    })
    it('Verify the Lora Server Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/0080000000000102'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app.should.have.property('name')
          app.should.have.property('devEUI')
          app.should.have.property('applicationID')
          app.should.have.property('description')
          app.should.have.property('deviceProfileID')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')
          app.should.have.property('skipFCntCheck')

          app.name.should.equal('MGRQD003')
          app.devEUI.should.equal('0080000000000102')
          app.deviceProfileID.should.equal(remoteDevicProfile)
          done()
        }
      })
    })
  })
  describe('Verify LoRaServer V2 has application', function () {
    let baseUrl = 'https://lora_appserver:8080/api'
    let loraKey = ''
    it('Get Lora Session', function (done) {
      let options = {}
      options.method = 'POST'
      options.url = baseUrl + '/internal/login'
      options.headers = {'Content-Type': 'application/json'}
      options.json = {username: 'admin', password: 'admin'}
      options.agentOptions = {'secureProtocol': 'TLSv1_2_method', 'rejectUnauthorized': false}
      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error on signin: ' + error)
          done(error)
        }
        else if (response.statusCode >= 400 || response.statusCode === 301) {
          appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
          done(response.statusCode)
        }
        else if (!body.jwt) {
          done(new Error('No token'))
        }
        else {
          loraKey = body.jwt
          done()
        }
      })
    })
    it('Verify the Lora Server Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/applications/4'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app = app.application
          console.log(app)
          app.should.have.property('id')
          app.should.have.property('name')
          app.should.have.property('description')
          app.should.have.property('organizationID')
          app.should.have.property('serviceProfileID')
          app.should.have.property('payloadCodec')
          app.should.have.property('payloadEncoderScript')
          app.should.have.property('payloadDecoderScript')
          app.name.should.equal('CATA')
          done()
        }
      })
    })
    it('Verify the Lora Server Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles?limit=4'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          console.log(app)
          app.should.have.property('totalCount')
          app.totalCount.should.equal('4')
          app.should.have.property('result')
          app.result.length.should.equal(4)
          remoteDevicProfile2 = app.result[3].id
          done()
        }
      })
    })
    it('Verify the Lora Server Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles/' + remoteDevicProfile2
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          console.log(app)
          app = app.deviceProfile
          app.should.have.property('name')
          app.name.should.equal('LoRaWeatherNode')
          app.should.have.property('organizationID')
          app.should.have.property('networkServerID')
          app.should.have.property('macVersion')
          app.should.have.property('regParamsRevision')
          app.macVersion.should.equal('1.0.0')
          app.regParamsRevision.should.equal('A')

          done()
        }
      })
    })
    it('Verify the Lora Server Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/0080000000000102'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app.device.should.have.property('name')
          app.device.should.have.property('devEUI')
          app.device.should.have.property('applicationID')
          app.device.should.have.property('description')
          app.device.should.have.property('deviceProfileID')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')
          app.device.should.have.property('skipFCntCheck')

          app.device.name.should.equal('MGRQD003')
          app.device.devEUI.should.equal('0080000000000102')
          app.device.deviceProfileID.should.equal(remoteDevicProfile2)
          done()
        }
      })
    })
  })

  describe('Create 2nd Device for Application', () => {
    it('POST Device', function (done) {
      server
        .post('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'applicationId': appId1,
          'name': 'MGRQD004',
          'description': 'GPS Node Model 004',
          'deviceModel': 'Mark4' })
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          deviceId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/devices/' + deviceId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let devObj = JSON.parse(res.text)
          devObj.name.should.equal('MGRQD004')
          devObj.description.should.equal('GPS Node Model 004')
          devObj.deviceModel.should.equal('Mark4')
          done()
        })
    })
    it('Create Device NTL', function (done) {
      server
        .post('/api/deviceNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'deviceId': deviceId2,
          'networkTypeId': 1,
          'deviceProfileId': dpId1,
          'networkSettings': {
            'devEUI': '0080000000000103',
            name: 'MGRQD004',
            deviceKeys: {
              'appKey': '11223344556677889900112233447777'
            }
          }
        })
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          console.log(dnlObj)
          dnlId2 = dnlObj.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceNetworkTypeLinks/' + dnlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          dnlObj.deviceId.should.equal(deviceId2)
          dnlObj.networkTypeId.should.equal(1)
          done()
        })
    })
  })
  describe('Verify LoRaServer V1 has 2nd Device', function () {
    let baseUrl = 'https://lora_appserver1:8080/api'
    let loraKey = ''
    it('Get Lora Session', function (done) {
      let options = {}
      options.method = 'POST'
      options.url = baseUrl + '/internal/login'
      options.headers = {'Content-Type': 'application/json'}
      options.json = {username: 'admin', password: 'admin'}
      options.agentOptions = {'secureProtocol': 'TLSv1_2_method', 'rejectUnauthorized': false}
      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error on signin: ' + error)
          done(error)
        }
        else if (response.statusCode >= 400 || response.statusCode === 301) {
          appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
          done(response.statusCode)
        }
        else if (!body.jwt) {
          done(new Error('No token'))
        }
        else {
          loraKey = body.jwt
          done()
        }
      })
    })

    it('Verify the Lora Server Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/0080000000000103'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app.should.have.property('name')
          app.should.have.property('devEUI')
          app.should.have.property('applicationID')
          app.should.have.property('description')
          app.should.have.property('deviceProfileID')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')
          app.should.have.property('skipFCntCheck')

          app.name.should.equal('MGRQD004')
          app.devEUI.should.equal('0080000000000103')
          app.deviceProfileID.should.equal(remoteDevicProfile)
          done()
        }
      })
    })
  })
  describe('Verify LoRaServer V2 has 2nd Device', function () {
    let baseUrl = 'https://lora_appserver:8080/api'
    let loraKey = ''
    it('Get Lora Session', function (done) {
      let options = {}
      options.method = 'POST'
      options.url = baseUrl + '/internal/login'
      options.headers = {'Content-Type': 'application/json'}
      options.json = {username: 'admin', password: 'admin'}
      options.agentOptions = {'secureProtocol': 'TLSv1_2_method', 'rejectUnauthorized': false}
      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error on signin: ' + error)
          done(error)
        }
        else if (response.statusCode >= 400 || response.statusCode === 301) {
          appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
          done(response.statusCode)
        }
        else if (!body.jwt) {
          done(new Error('No token'))
        }
        else {
          loraKey = body.jwt
          done()
        }
      })
    })

    it('Verify the Lora Server Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/0080000000000103'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app.device.should.have.property('name')
          app.device.should.have.property('devEUI')
          app.device.should.have.property('applicationID')
          app.device.should.have.property('description')
          app.device.should.have.property('deviceProfileID')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')
          app.device.should.have.property('skipFCntCheck')

          app.device.name.should.equal('MGRQD004')
          app.device.devEUI.should.equal('0080000000000103')
          app.device.deviceProfileID.should.equal(remoteDevicProfile2)
          done()
        }
      })
    })
  })

})
