/* eslint-disable no-unused-vars */
var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var createApp = require('../../../restApp')
var should = chai.should()
var setup = require('../setup.js')
const { wait } = require('../../lib/helpers')
var appLogger = require('../../../rest/lib/appLogger.js')
const Lora1 = require('../networks/lora-v1')
const Lora2 = require('../networks/lora-v2')
const Loriot = require('../networks/loriot')
const Ttn = require('../networks/ttn')

chai.use(chaiHttp)
var server

const {
  TTN_ENABLED,
  LORIOT_ENABLED,
  TTN_USERNAME,
  TTN_PASSWORD,
  TTN_CLIENT_ID,
  TTN_CLIENT_SECRET,
  LORIOT_API_KEY
} = process.env

const describeTTN = TTN_ENABLED === 'true' ? describe : describe.skip.bind(describe)
const describeLoriot = LORIOT_ENABLED === 'true' ? describe : describe.skip.bind(describe)

describe('E2E Test for Multiple Networks', () => {
  let adminToken
  let userId
  let userToken
  let netProvId
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
    loriot: {
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

  before(async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    await setup.start()
    await wait(10000)
    await Promise.all([Lora1.setup(), Lora2.setup()])
    if (LORIOT_ENABLED === 'true') await Loriot.setup()
    // if (TTN_ENABLED === 'true') await Ttn.setup()
  })

  describe('Verify Login and Administration of Users Works', () => {
    it('Admin Login to LPWan Server', async () => {
      const res = await server
        .post('/api/sessions')
        .send({ 'login_username': 'admin', 'login_password': 'password' })
      res.should.have.status(200)
      adminToken = res.text
    })

    it('Create a Application User Account', async () => {
      const res = await server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'bobmouse', 'password': 'mousetrap', 'role': 'user', 'companyId': 1 })
      res.should.have.status(200)
      let ret = JSON.parse(res.text)
      ret.should.have.property('id')
      userId = ret.id
    })
    it('Verify Application User Exists', async () => {
      const res = await server
        .get('/api/users/' + userId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
      res.should.have.status(200)
      let userObj = JSON.parse(res.text)
      userObj.username.should.equal('bobmouse')
      userObj.role.should.equal('user')
    })
    it('Application User Login to LPWan Server', async () => {
      const res = await server
        .post('/api/sessions')
        .send({'login_username': 'bobmouse', 'login_password': 'mousetrap'})
      res.should.have.status(200)
      userToken = res.text
      should.exist(userToken)
    })
  })

  describe('Setup Networks', () => {
    describe('Setup Lora 1.0 Network', () => {
      it('Create Network Provider', async () => {
        const res = await server
          .post('/api/networkProviders')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({ 'name': 'Kyrio' })
        netProvId = JSON.parse(res.text).id
      })
      it('Verify LoraOS 1.0 Protocol Exists', async () => {
        const res = await server
          .get('/api/networkProtocols?search=LoRa Server&networkProtocolVersion=1.0')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
        res.should.have.status(200)
        let result = JSON.parse(res.text)
        appLogger.log(result)
        result.records.should.be.instanceof(Array)
        result.records.should.have.length(1)
        result.totalCount.should.equal(1)
        result.records[0].should.have.property('networkProtocolVersion')
        result.records[0].networkProtocolVersion.should.equal('1.0')
        lora.loraV1.protocolId = result.records[0].id
      })
      it('Create the Local LoraOS 1.0 Network', (done) => {
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({
            'name': 'LocalLoraOS1_0',
            'networkProviderId': netProvId,
            'networkTypeId': 1,
            'baseUrl': Lora1.network.baseUrl,
            'networkProtocolId': lora.loraV1.protocolId,
            'securityData': { authorized: false, ...Lora1.network.securityData }
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
            network.baseUrl.should.equal(Lora1.network.baseUrl)
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
            let result = JSON.parse(res.text)
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
            'networkProviderId': netProvId,
            'networkTypeId': 1,
            'baseUrl': Lora2.network.baseUrl,
            'networkProtocolId': lora.loraV2.protocolId,
            'securityData': { authorized: false, ...Lora2.network.securityData }
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            let network = JSON.parse(res.text)
            appLogger.log(network)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            lora.loraV2.networkId = network.id
            Lora2.network.id = network.id
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
            let network = JSON.parse(res.text)
            network.name.should.equal('LocalLoraOS2_0')
            network.baseUrl.should.equal(Lora2.network.baseUrl)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
      })
    })
    describeLoriot('Setup Loriot Network', () => {
      it('Verify Loriot Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=Loriot&networkProtocolVersion=4.0')
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
            result.records[0].networkProtocolVersion.should.equal('4.0')
            lora.loriot.protocolId = result.records[0].id
            done()
          })
      })
      it('Create the Local Loriot 4.0 Network', (done) => {
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({
            'name': 'LocalLoriot',
            'networkProviderId': netProvId,
            'networkTypeId': 1,
            'baseUrl': Loriot.network.baseUrl,
            'networkProtocolId': lora.loriot.protocolId,
            'securityData': {
              apiKey: LORIOT_API_KEY
            }
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            let network = JSON.parse(res.text)
            appLogger.log(network)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            lora.loriot.networkId = network.id
            done()
          })
      })
    })

    describeTTN('Setup TTN Network', () => {
      it('Verify TTN Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=The Things Network&networkProtocolVersion=2.0')
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
            result.records[0].networkProtocolVersion.should.equal('2.0')
            lora.ttn.protocolId = result.records[0].id
            done()
          })
      })
      it('Create the Local TTN 2.0 Network', (done) => {
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({
            'name': 'LocalTTN',
            'networkProviderId': netProvId,
            'networkTypeId': 1,
            'baseUrl': Ttn.network.baseUrl,
            'networkProtocolId': lora.ttn.protocolId,
            securityData: Ttn.network.securityData
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            let network = JSON.parse(res.text)
            appLogger.log(network)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            lora.ttn.networkId = network.id
            done()
          })
      })
      it('Get Network', (done) => {
        server
          .get('/api/networks/' + lora.ttn.networkId)
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send()
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            let network = JSON.parse(res.text)
            network.name.should.equal('LocalTTN')
            network.baseUrl.should.equal(Ttn.network.baseUrl)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
      })
    })
  })
  describe('After “authorized” network, automatically pulls the devices & applications', () => {
    describe('Lora 1.0', () => {
      it('Verify the Cablelabs Organization was Created', (done) => {
        server
          .get('/api/companies')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let companies = JSON.parse(res.text)
            companies.should.have.property('totalCount')
            companies.should.have.property('records')
            companies.totalCount.should.equal(2)
            companies.records[0].name.should.equal('SysAdmins')
            companies.records[1].name.should.equal('cablelabs')
            done()
          })
      })
    })
    describe('Lora 2.0', () => {
      it('Verify the Cablelabs Organization was Created', (done) => {
        server
          .get('/api/companies')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let companies = JSON.parse(res.text)
            companies.should.have.property('totalCount')
            companies.should.have.property('records')
            companies.totalCount.should.equal(2)
            companies.records[0].name.should.equal('SysAdmins')
            companies.records[1].name.should.equal('cablelabs')
            done()
          })
      })
    })
    describeTTN('TTN 2.0', () => {
      it('Verify the Cablelabs Organization was Created', (done) => {
        server
          .get('/api/companies')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let companies = JSON.parse(res.text)
            companies.should.have.property('totalCount')
            companies.should.have.property('records')
            companies.totalCount.should.equal(2)
            companies.records[0].name.should.equal('SysAdmins')
            companies.records[1].name.should.equal('cablelabs')
            done()
          })
      })
    })

    describe('Lora 1.0 Application Verification', () => {
      it('Verify the Test Application was Created', (done) => {
        server
          .get('/api/applications')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let applications = JSON.parse(res.text)
            appLogger.log(applications)
            applications.should.have.property('totalCount')
            applications.should.have.property('records')
            // applications.totalCount.should.equal(2)
            let application = applications.records.find(x => x.name === Lora1.application.name)
            application.name.should.equal(Lora1.application.name)
            application.description.should.equal(Lora1.application.description)
            lora.loraV1.apps.push({
              appId: application.id,
              appNTLId: '',
              deviceIds: [],
              deviceProfileIds: [],
              deviceNTLIds: []
            })
            done()
          })
      })
      it('Verify the Test Application NTL was Created', (done) => {
        let expected = {
          'id': 1,
          'applicationId': 1,
          'networkTypeId': 1,
          networkSettings: {
            'canotaa': true,
            'cansend': true,
            'clientsLimit': null,
            'description': 'CableLabs Test Application',
            'deviceLimit': null,
            'devices': null,
            'id': '27',
            'joinServer': null,
            'name': 'BobMouseTrapLv1',
            'ogwinfo': null,
            'organizationID': '56',
            'orx': true,
            'overbosity': null,
            'payloadCodec': '',
            'payloadDecoderScript': '',
            'payloadEncoderScript': '',
            'serviceProfileID': '8ea5916b-70d0-4e9c-a4f4-1e07981d41be',
            'suspended': false
          }
        }
        should.exist(lora.loraV1.apps[0].appId)
        server
          .get('/api/applicationNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let appNTLs = JSON.parse(res.text)
            appLogger.log(appNTLs)
            appLogger.log(lora.loraV1.apps)
            appNTLs.should.have.property('totalCount')
            appNTLs.should.have.property('records')
            // appNTLs.totalCount.should.equal(2)
            let appNTL = appNTLs.records.find(x => x.applicationId === lora.loraV1.apps[0].appId)
            should.exist(appNTL)
            lora.loraV1.apps[0].appNTLId = appNTL.id
            done()
          })
      })
    })
    describe('Lora 2.0 Application Verification', () => {
      it('Verify the Test Application was Created', (done) => {
        server
          .get('/api/applications')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let applications = JSON.parse(res.text)
            applications.should.have.property('totalCount')
            applications.should.have.property('records')
            appLogger.log(applications, 'error')
            // applications.totalCount.should.equal(2)
            let application = applications.records.find(x => x.name === Lora2.application.name)
            should.exist(application)
            application.name.should.equal(Lora2.application.name)
            application.description.should.equal(Lora2.application.description)
            lora.loraV2.apps.push({
              appId: application.id,
              appNTLId: '',
              deviceIds: [],
              deviceProfileIds: [],
              deviceNTLIds: []
            })
            done()
          })
      })
      it('Verify the Test Application NTL was Created', (done) => {
        let expected = {
          'id': 2,
          'applicationId': 2,
          'networkTypeId': 1,
          'networkSettings': {
            'canotaa': true,
            'cansend': true,
            'clientsLimit': null,
            'description': 'CableLabs Test Application',
            'deviceLimit': null,
            'devices': null,
            'id': '2',
            'joinServer': null,
            'name': 'BobMouseTrapLv2',
            'ogwinfo': null,
            'organizationID': '10',
            'orx': true,
            'overbosity': null,
            'payloadCodec': '',
            'payloadDecoderScript': '',
            'payloadEncoderScript': '',
            'serviceProfileID': 'de9d9f33-26ab-43b3-9088-d65801240e0e',
            'suspended': false

          }
        }
        appLogger.log(lora.loraV2)
        should.exist(lora.loraV2.apps[0].appId)
        server
          .get('/api/applicationNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let appNTLs = JSON.parse(res.text)
            appNTLs.should.have.property('totalCount')
            appNTLs.should.have.property('records')
            // appNTLs.totalCount.should.equal(2)
            let appNTL = appNTLs.records.find(x => x.applicationId === lora.loraV2.apps[0].appId)
            should.exist(appNTL)
            lora.loraV2.apps[0].appNTLId = appNTL.id
            done()
          })
      })
    })
    describeLoriot('Loriot 4.0 Application Verification', () => {
      it('Verify the Test Application was Created', (done) => {
        server
          .get('/api/applications')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) return done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let applications = JSON.parse(res.text)
            appLogger.log(applications)
            applications.should.have.property('totalCount')
            applications.should.have.property('records')
            // applications.totalCount.should.equal(2)
            let application = applications.records.find(x => x.name === Loriot.application.title)
            should.exist(application)
            lora.loriot.apps.push({
              appId: application.id,
              appNTLId: '',
              deviceIds: [],
              deviceProfileIds: [],
              deviceNTLIds: []
            })
            done()
          })
      })
      it('Verify the Test Application NTL was Created', (done) => {
        let expected = {
          'id': 3,
          'applicationId': 3,
          'networkTypeId': 1,
          networkSettings: {
            'canotaa': true,
            'cansend': true,
            'clientsLimit': null,
            'deviceLimit': null,
            'devices': null,
            'joinServer': null,
            'ogwinfo': null,
            'orx': true,
            'overbosity': null,
            'suspended': false
          }
        }
        should.exist(lora.loriot.apps[0].appId)
        server
          .get('/api/applicationNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let appNTLs = JSON.parse(res.text)
            appLogger.log(appNTLs)
            appLogger.log(lora.loraV1.apps)
            appNTLs.should.have.property('totalCount')
            appNTLs.should.have.property('records')
            // appNTLs.totalCount.should.equal(2)
            let appNTL = appNTLs.records.find(x => x.applicationId === lora.loriot.apps[0].appId)
            should.exist(appNTL)
            appLogger.log(appNTL)
            // appNTL.should.eql(expected)
            lora.loraV1.apps[0].appNTLId = appNTL.id
            done()
          })
      })
    })
    describeTTN('TTN Application Verification', () => {
      it('Verify the Test Application was Created', (done) => {
        server
          .get('/api/applications')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) return done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let applications = JSON.parse(res.text)
            applications.should.have.property('totalCount')
            applications.should.have.property('records')
            appLogger.log(applications, 'error')
            let application = applications.records.find(x => x.name === Ttn.application.id)
            should.exist(application)
            application.description.should.equal(Ttn.application.name)
            lora.ttn.apps.push({
              appId: application.id,
              appNTLId: '',
              deviceIds: [],
              deviceProfileIds: [],
              deviceNTLIds: []
            })
            done()
          })
      })
      it('Verify the Test Application NTL was Created', (done) => {
        let expected = {
          'applicationId': 3,
          'id': 3,
          'networkSettings': {
            'description': 'Prototype Application for CableLabs Trial',
            'id': 'cablelabs-prototype',
            'key': 'ttn-account-v2.oJPyRNrsSFr5ukIcN4hRQI1DPjF5LczGi_pPbF4Rmg4',
            'name': 'cablelabs-prototype',
            'organizationID': 'dschrimpsherr',
            'payloadCodec': 'cayennelpp',
            'serviceProfileID': 'ttn-handler-us-west'
          },
          'networkTypeId': 1
        }

        appLogger.log(lora.ttn)
        should.exist(lora.ttn.apps[0].appId)
        server
          .get('/api/applicationNetworkTypeLinks/' + lora.ttn.apps[0].appId)
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let appNTL = JSON.parse(res.text)
            should.exist(appNTL)
            appLogger.log(appNTL)
            // appNTL.should.eql(expected)
            lora.ttn.apps[0].appNTLId = appNTL.id
            done()
          })
      })
    })

    describe('Lora 1.0 Device Verification', () => {
      it('Verify the Test1 Device Profile was Created', (done) => {
        let expected = {
          'id': 1,
          'networkTypeId': 1,
          'companyId': 1,
          'name': 'BobMouseTrapDeviceProfileLv1',
          'networkSettings': {
            'deviceProfileID': '5d1e49eb-28c8-411b-9cbf-87650d103d51',
            'supportsClassB': false,
            'classBTimeout': 0,
            'pingSlotPeriod': 0,
            'pingSlotDR': 0,
            'pingSlotFreq': 0,
            'supportsClassC': false,
            'classCTimeout': 0,
            'macVersion': '1.0.0',
            'regParamsRevision': 'A',
            'rxDelay1': 0,
            'rxDROffset1': 0,
            'rxDataRate2': 0,
            'rxFreq2': 0,
            'factoryPresetFreqs': [],
            'maxEIRP': 0,
            'maxDutyCycle': 0,
            'supportsJoin': true,
            'rfRegion': 'US902',
            'supports32bitFCnt': false
          },
          'description': 'Device Profile managed by LPWAN Server, perform changes via LPWAN'
        }
        server
          .get('/api/deviceProfiles')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceProfiles = JSON.parse(res.text)
            deviceProfiles.should.have.property('totalCount')
            deviceProfiles.should.have.property('records')
            // deviceProfiles.totalCount.should.equal(2)
            let deviceProfile = deviceProfiles.records.find(x => x.name === Lora1.deviceProfile.name)
            should.exist(deviceProfile)
            deviceProfile.description.should.equal('Device Profile managed by LPWAN Server, perform changes via LPWAN')
            deviceProfile.id.should.equal(1)
            deviceProfile.name.should.equal(Lora1.deviceProfile.name)
            deviceProfile.networkSettings.name.should.equal(Lora1.deviceProfile.name)
            deviceProfile.networkSettings.networkServerID.should.equal(Lora1.deviceProfile.networkServerID)
            deviceProfile.networkSettings.organizationID.should.equal(Lora1.deviceProfile.organizationID)
            lora.loraV1.apps[0].deviceProfileIds.push(deviceProfile.id)
            done()
          })
      })
      it('Verify the Test Device was Created', (done) => {
        let expected = {
          'id': 1,
          'applicationId': lora.loraV1.apps[0].appId,
          'name': Lora1.device.name,
          'deviceModel': null,
          'description': Lora1.device.description
        }
        server
          .get('/api/devices')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let devices = JSON.parse(res.text)
            devices.should.have.property('totalCount')
            devices.should.have.property('records')
            // devices.totalCount.should.equal(2)
            let device = devices.records.find(x => x.name === Lora1.device.name)
            should.exist(device)
            device.should.eql(expected)
            lora.loraV1.apps[0].deviceIds.push(device.id)
            done()
          })
      })
      it('Verify the Test Device NTL was Created', (done) => {
        appLogger.log(lora, 'info')
        let expected = {
          'id': 1,
          'deviceId': lora.loraV1.apps[0].deviceIds[0],
          'networkTypeId': 1,
          'deviceProfileId': lora.loraV1.apps[0].deviceProfileIds[0],
          'networkSettings': {
            'devEUI': '3456789012345678',
            'name': 'BobMouseTrapDeviceLv1',
            'applicationID': '27',
            'description': 'Test Device for E2E',
            'deviceProfileID': 'c86725a2-bd60-4a8b-8f2d-0840a38853ad',
            'deviceStatusBattery': 256,
            'deviceStatusMargin': 256,
            'lastSeenAt': '',
            'skipFCntCheck': false,
            'deviceActivation': {
              'aFCntDown': 0,
              'appSKey': '9a6c5d6e9d4bcde4fe489d477e942b03',
              'devAddr': '017b45d9',
              'fCntUp': 0,
              'nwkSEncKey': '33d579ae37f41205ee66e2e03a8a2356',
              'fNwkSIntKey': '33d579ae37f41205ee66e2e03a8a2356',
              'sNwkSIntKey': '33d579ae37f41205ee66e2e03a8a2356'
            }
          }
        }
        server
          .get('/api/deviceNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceNTLs = JSON.parse(res.text)
            deviceNTLs.should.have.property('totalCount')
            deviceNTLs.should.have.property('records')
            // deviceNTLs.totalCount.should.equal(2)
            let deviceNTL = deviceNTLs.records.find(x => x.deviceId === lora.loraV1.apps[0].deviceIds[0])
            should.exist(deviceNTL)
            lora.loraV1.apps[0].deviceNTLIds.push(deviceNTL.id)
            done()
          })
      })
    })
    describe('Lora 2.0 Device Verification', () => {
      it('Verify the Test1 Device Profile was Created', (done) => {
        let expected = {
          'id': 2,
          'networkTypeId': 1,
          'companyId': 1,
          'name': 'BobMouseTrapDeviceProfileLv2',
          'networkSettings': {
            'id': '9dd538e8-a231-4a35-8823-eecbffb9d4a9',
            'supportsClassB': false,
            'classBTimeout': 0,
            'pingSlotPeriod': 0,
            'pingSlotDR': 0,
            'pingSlotFreq': 0,
            'supportsClassC': false,
            'classCTimeout': 0,
            'macVersion': '1.0.0',
            'regParamsRevision': 'A',
            'rxDelay1': 0,
            'rxDROffset1': 0,
            'rxDataRate2': 0,
            'rxFreq2': 0,
            'factoryPresetFreqs': [],
            'maxEIRP': 0,
            'name': 'BobMouseTrapDeviceProfileLv2',
            'networkServerID': '1',
            'organizationID': '10',
            'maxDutyCycle': 0,
            'supportsJoin': false,
            'rfRegion': 'US902'
          },
          'description': 'Device Profile managed by LPWAN Server, perform changes via LPWAN'
        }
        server
          .get('/api/deviceProfiles')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) return done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceProfiles = JSON.parse(res.text)
            deviceProfiles.should.have.property('totalCount')
            deviceProfiles.should.have.property('records')
            // deviceProfiles.totalCount.should.equal(2)
            let deviceProfile = deviceProfiles.records.find(x => x.name === Lora2.deviceProfile.name)
            should.exist(deviceProfile)
            // deviceProfile.should.eql(expected)
            lora.loraV2.apps[0].deviceProfileIds.push(deviceProfile.id)
            done()
          })
      })
      it('Verify the Test Device was Created', (done) => {
        let expected = {
          'id': 2,
          'applicationId': lora.loraV2.apps[0].appId,
          'name': 'BobMouseTrapDeviceLv2',
          'deviceModel': null,
          'description': 'Test Device for E2E'
        }
        server
          .get('/api/devices')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let devices = JSON.parse(res.text)
            devices.should.have.property('totalCount')
            devices.should.have.property('records')
            // devices.totalCount.should.equal(2)
            let device = devices.records.find(x => x.name === Lora2.device.name)
            should.exist(device)
            appLogger.log(device)
            // device.should.eql(expected)
            lora.loraV2.apps[0].deviceIds.push(device.id)
            done()
          })
      })
      it('Verify the Test Device NTL was Created', (done) => {
        let expected = {
          'id': 2,
          'deviceId': lora.loraV2.apps[0].deviceIds[0],
          'networkTypeId': 1,
          deviceProfileId: 2,
          'networkSettings': {
            'devEUI': '3344556677889900',
            'name': 'BobMouseTrapDeviceLv2',
            'applicationID': '2',
            'description': 'Test Device for E2E',
            'deviceProfileID': '9dd538e8-a231-4a35-8823-eecbffb9d4a9',
            'skipFCntCheck': false,
            'deviceStatusBattery': 256,
            'deviceStatusMargin': 256,
            'lastSeenAt': null,
            'deviceActivation': {
              'aFCntDown': 0,
              'appSKey': '204bc999b089983dceaef567d111722c',
              'devAddr': '013ac7fe',
              'devEUI': '',
              'fCntUp': 0,
              'fNwkSIntKey': 'a27bd1658d6ae4ed8d4e6d35a4857960',
              'nFCntDown': 0,
              'nwkSEncKey': 'a27bd1658d6ae4ed8d4e6d35a4857960',
              'sNwkSIntKey': 'a27bd1658d6ae4ed8d4e6d35a4857960'
            }
          }
        }
        server
          .get('/api/deviceNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceNTLs = JSON.parse(res.text)
            deviceNTLs.should.have.property('totalCount')
            deviceNTLs.should.have.property('records')
            // deviceNTLs.totalCount.should.equal(2)
            let deviceNTL = deviceNTLs.records.find(x => x.deviceId === lora.loraV2.apps[0].deviceIds[0])
            should.exist(deviceNTL)
            appLogger.log(deviceNTL)
            // deviceNTL.should.eql(expected)
            lora.loraV2.apps[0].deviceNTLIds.push(deviceNTL.id)
            done()
          })
      })
    })
    describeLoriot('Loriot 4.0 Device Verification', () => {
      it('Verify the Test1 Device Profile was Created', (done) => {
        let expected = {
          'id': 3,
          'networkTypeId': 1,
          'companyId': 1,
          'name': '00-80-00-00-04-00-15-46',
          'networkSettings': {
            'macVersion': '1.0.3',
            'supportsJoin': true
          },
          'description': 'Device Profile managed by LPWAN Server, perform changes via LPWAN'
        }
        server
          .get('/api/deviceProfiles')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceProfiles = JSON.parse(res.text)
            deviceProfiles.should.have.property('totalCount')
            deviceProfiles.should.have.property('records')
            // deviceProfiles.totalCount.should.equal(2)
            let deviceProfile = deviceProfiles.records.find(x => x.name === Loriot.device.title)
            should.exist(deviceProfile)
            deviceProfile.id.should.equal(3)
            lora.loriot.apps[0].deviceProfileIds.push(deviceProfile.id)
            done()
          })
      })
      it('Verify the Test Device was Created', (done) => {
        let expected = {
          'id': 3,
          'applicationId': lora.loriot.apps[0].appId,
          'name': Loriot.device.title,
          'deviceModel': null,
          'description': Loriot.device.description
        }
        server
          .get('/api/devices')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let devices = JSON.parse(res.text)
            devices.should.have.property('totalCount')
            devices.should.have.property('records')
            // devices.totalCount.should.equal(2)
            let device = devices.records.find(x => x.name === expected.name)
            should.exist(device)
            appLogger.log(device)
            device.should.eql(expected)
            lora.loriot.apps[0].deviceIds.push(device.id)
            done()
          })
      })
      it('Verify the Test Device NTL was Created', (done) => {
        appLogger.log(lora, 'info')
        let expected = {
          'id': 1,
          'deviceId': lora.loriot.apps[0].deviceIds[0],
          'networkTypeId': 1,
          'deviceProfileId': lora.loriot.apps[0].deviceProfileIds[0],
          'networkSettings': {
            'devEUI': '3456789012345678'
          }
        }
        server
          .get('/api/deviceNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceNTLs = JSON.parse(res.text)
            deviceNTLs.should.have.property('totalCount')
            deviceNTLs.should.have.property('records')
            // deviceNTLs.totalCount.should.equal(2)
            let deviceNTL = deviceNTLs.records.find(x => x.deviceId === expected.deviceId)
            should.exist(deviceNTL)
            appLogger.log(deviceNTL)
            // deviceNTL.should.eql(expected)
            lora.loriot.apps[0].deviceNTLIds.push(deviceNTL.id)
            done()
          })
      })
    })
    describeTTN('TTN Device Verification', () => {
      it('Verify the Test1 Device Profile was Created', (done) => {
        let expected = {
          'id': 3,
          'networkTypeId': 1,
          'companyId': 1,
          'name': 'CableLabs TTN Device ABP',
          'networkSettings': {
            'id': 'cl-weather-station-profile',
            'name': 'CableLabs TTN Device ABP',
            'supportsClassB': false,
            'classBTimeout': 0,
            'pingSlotPeriod': 0,
            'pingSlotDR': 0,
            'pingSlotFreq': 0,
            'supportsClassC': false,
            'classCTimeout': 0,
            'macVersion': '1.0.0',
            'regParamsRevision': 'A',
            'rxDelay1': 0,
            'rxDROffset1': 0,
            'rxDataRate2': 0,
            'rxFreq2': 0,
            'factoryPresetFreqs': [],
            'maxEIRP': 0,
            'networkServerID': 'ttn-handler-us-west',
            'organizationID': 'dschrimpsherr',
            'supportsJoin': false,
            'rfRegion': 'US902'
          },
          'description': 'Device Profile managed by LPWAN Server, perform changes via LPWAN'
        }
        server
          .get('/api/deviceProfiles')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceProfiles = JSON.parse(res.text)
            deviceProfiles.should.have.property('totalCount')
            deviceProfiles.should.have.property('records')
            console.log(JSON.stringify(deviceProfiles.records))
            // deviceProfiles.totalCount.should.equal(2)
            let deviceProfile1 = deviceProfiles.records.find(x => x.name === Ttn.abpDevice.description)
            let deviceProfile2 = deviceProfiles.records.find(x => x.name === Ttn.otaaDevice.description)
            should.exist(deviceProfile1)
            should.exist(deviceProfile2)
            // deviceProfile.should.eql(expected)
            lora.ttn.apps[0].deviceProfileIds.push(deviceProfile1.id)
            lora.ttn.apps[0].deviceProfileIds.push(deviceProfile2.id)
            done()
          })
      })
      it('Verify the Test Device was Created', (done) => {
        let expected = {
          'id': 3,
          'applicationId': lora.ttn.apps[0].appId,
          'name': 'BobMouseTrapDeviceLv2',
          'deviceModel': null,
          'description': 'Test Device for E2E'
        }
        server
          .get('/api/devices')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let devices = JSON.parse(res.text)
            devices.should.have.property('totalCount')
            devices.should.have.property('records')
            appLogger.log(devices)
            // devices.totalCount.should.equal(2)
            let device1 = devices.records.find(x => x.name === Ttn.abpDevice.lorawan_device.dev_eui)
            let device2 = devices.records.find(x => x.name === Ttn.otaaDevice.lorawan_device.dev_eui)
            should.exist(device1)
            should.exist(device2)
            lora.ttn.apps[0].deviceIds.push(device1.id)
            lora.ttn.apps[0].deviceIds.push(device2.id)

            done()
          })
      })
      it('Verify the Test Device NTL was Created', (done) => {
        let expected = {
          'id': 2,
          'deviceId': lora.loraV2.apps[0].deviceIds[0],
          'networkTypeId': 1,
          deviceProfileId: 2,
          'networkSettings': {
            'devEUI': '3344556677889900',
            'name': 'BobMouseTrapDeviceLv2',
            'applicationID': '2',
            'description': 'Test Device for E2E',
            'deviceProfileID': '9dd538e8-a231-4a35-8823-eecbffb9d4a9',
            'skipFCntCheck': false,
            'deviceStatusBattery': 256,
            'deviceStatusMargin': 256,
            'lastSeenAt': null,
            'deviceActivation': {
              'aFCntDown': 0,
              'appSKey': '204bc999b089983dceaef567d111722c',
              'devAddr': '013ac7fe',
              'devEUI': '',
              'fCntUp': 0,
              'fNwkSIntKey': 'a27bd1658d6ae4ed8d4e6d35a4857960',
              'nFCntDown': 0,
              'nwkSEncKey': 'a27bd1658d6ae4ed8d4e6d35a4857960',
              'sNwkSIntKey': 'a27bd1658d6ae4ed8d4e6d35a4857960'
            }
          }
        }
        server
          .get('/api/deviceNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceNTLs = JSON.parse(res.text)
            deviceNTLs.should.have.property('totalCount')
            deviceNTLs.should.have.property('records')
            appLogger.log(deviceNTLs)

            // deviceNTLs.totalCount.should.equal(2)
            let deviceNTL = deviceNTLs.records.find(x => x.deviceId === lora.loraV2.apps[0].deviceIds[0])
            should.exist(deviceNTL)
            appLogger.log(deviceNTL)
            // deviceNTL.should.eql(expected)
            lora.ttn.apps[0].deviceNTLIds.push(deviceNTL.id)
            done()
          })
      })
    })
  })
})
