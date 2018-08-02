var assert = require('assert')
var chai = require('chai')
var should = chai.should()
var MockServer = require('../../rest/models/ModelAPI')
var mockServer = {}
var testNetwork = {}
var nconf = require('nconf')
var loginData = {}
var mockDataAPI = require('./mock-data-api')
var session = {}

describe('Loriot Unit Tests for Authorization', () => {
  before('Create Network Protocol', async () => {
    nconf.argv().env()
    nconf.file({ file: 'config.hjson.loriot-unit', format: require('hjson') })
    mockServer = new MockServer()
    loginData = {
      token_type: 'bearer',
      apiKey: 'AAAA-AoAM01_Yc4sUCAutgeOPzU9HXMqoDAnuR-TeChmRTuDM'
    }
    testNetwork = await mockServer.networks.createNetwork('Test Network', 2, 1, 2, 'https://us1.loriot.io', loginData)
  })

  it('Verify Network', async () => {
    let actualNetwork = await mockServer.networks.retrieveNetwork(1)
    actualNetwork.name.should.equal('Test Network')
    actualNetwork.networkTypeId.should.equal(1)
    actualNetwork.networkProviderId.should.equal(2)
    actualNetwork.networkProtocolId.should.equal(2)
    actualNetwork.baseUrl.should.equal('https://us1.loriot.io')
    actualNetwork.securityData.token_type.should.equal(loginData.token_type)
    actualNetwork.securityData.apiKey.should.equal(loginData.apiKey)
  })
  it('Verify Connect', async () => {
    let loriotProtocol = await mockServer.networkProtocols.retrieveNetworkProtocol(1)
    let loriot = require('../../rest/networkProtocols/' + loriotProtocol.protocolHandler)
    let token = await loriot.connect(testNetwork, loginData)
    session = {connection: token}
  })
  it('Get Applications', async () => {
    let loriotProtocol = await mockServer.networkProtocols.retrieveNetworkProtocol(1)
    let loriot = require('../../rest/networkProtocols/' + loriotProtocol.protocolHandler)
    let app = await loriot.getApplications(session, testNetwork, mockDataAPI)
    app.should.have.property('apps')
    app.should.have.property('page')
    app.should.have.property('total')
    app.should.have.property('perPage')

    app.apps.length.should.equal(1)
    app.apps[0].name.should.equal('ApiTest')

    app.page.should.equal(1)
    app.total.should.equal(1)
    app.perPage.should.equal(10)
  })
})
