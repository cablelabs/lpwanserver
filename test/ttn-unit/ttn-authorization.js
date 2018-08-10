var assert = require('assert')
var chai = require('chai')
var should = chai.should()
var MockServer = require('../../rest/models/ModelAPI')
var mockServer = {}
var ttn = require('../../rest/networkProtocols/TheThingsNetwork')
var testNetwork = {}
var nconf = require('nconf')
var loginData = {}
var mockDataAPI = require('./mock-data-api')
var session = {}
var NetworkProtocols = require('../../rest/networkProtocols/networkProtocols')
var protos = {}
var appLogger = require('../../rest/lib/appLogger')
const request = require('request')

// token_type: 'bearer',
// refresh_token: 'MRngl-2ZIiYORfN5pr3DgB3M8IoeZ1eJCU6XiYVxd3Y',
//   access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI1YjJhN2IyMTZhNDFhZTAwMzBhOTExZWQiLCJpc3MiOiJ0dG4tYWNjb3VudC12MiIsImlhdCI6MTUzMjk5MDkyMiwidHlwZSI6InVzZXIiLCJjbGllbnQiOiJscHdhbi10ZXN0Iiwic2NvcGUiOlsicHJvZmlsZSIsImFwcHMiLCJjb21wb25lbnRzIiwiZ2F0ZXdheXMiXSwiaW50ZXJjaGFuZ2VhYmxlIjp0cnVlLCJ1c2VybmFtZSI6ImRzY2hyaW1wc2hlcnIiLCJlbWFpbCI6ImQuc2NocmltcHNoZXJAY2FibGVsYWJzLmNvbSIsImNyZWF0ZWQiOiIyMDE4LTA2LTIwVDE2OjA0OjQ5Ljc2N1oiLCJuYW1lIjp7ImZpcnN0IjoiRGFuIiwibGFzdCI6IlNjaHJpbXBzaGVyIn0sInZhbGlkIjp0cnVlLCJfaWQiOiI1YjJhN2IyMTZhNDFhZTAwMzBhOTExZWQiLCJleHAiOjE1MzI5OTQ1ODJ9.tuJenSfhHe5TE3tgeiA8n-l356y5d82I8FrsSj7YVcKdNCcQNDhf19qlMKovG7ffrkW8LKq68DpjagJJUZfLKGIckuEtvUfKduXJjCyjharFM2rd9_BIu0lHwaFbErBjBHRT6x0Mk52tv1zUARQJaiu5pKHKYaKkJPGcS1OO0zPJvTa6B5NU0jqg3oLMOcHk-W94xIwJZtRDH2j64MFo2d30bFRI2UWDl3wVVZlGmgYJyJeVCcGJ2-lTjY045YHMq9-peWR1v25k3INto1swbVmrEmlc4dWgsefj7YFCT6cnyb80NrdcRg2FloEpnDRl7gowN8fmcy3z8orQjCoiCCsYHdmKNFjk4l8w-P97yRP9CDfNEfwDlEGIf9A4M0JNZXPtXX7eXSbAYh-wYaocK8cULR5DStFmXa7DowymiTRFQaKvwk_t5uUb5fmZ6H09XvCuReiUpcHx7of4xjh4p7eE8qrWUdH8vsO6Una1PAXkS0JwdXj6-bEDD9gT2hcm0GhCuYCu6SSwD1yeC5UOcnxvHvR39lWygArIIeKSU8zDHeRxx4oG1J6Lu5A8BebPqlU4LAeoGmac3AxQ-r4mxfDt2ISsQMXEwE3IsIP0bBi_VsDRnlC9SO3GYslWJaR35f8lnIdBtU_RjEF2RBIwBmHGFX5Yv7xoigbWJO0BP9E',
//   expires_in: 3600,


var oauth = 'https://account.thethingsnetwork.org/users/authorize?client_id=lpwan-test&redirect_uri=https://mercury.schrimpsher.com:3200/api/oauth/callback&response_type=code'

describe('TTN Unit Tests for Authorization', () => {
  before('Create Network', async () => {
    nconf.argv().env()
    nconf.file({file: 'config.hjson.ttn-unit', format: require('hjson')})
    mockServer = new MockServer()
    appLogger.initRESTCallLogger(this);
    loginData = {
      clientId: 'lpwan-test',
      clientSecret: 'aOQCcwUgfq9PjBQUanlj5xRG2RTZcFbNkRcSrMsnq9wg5LH-Svw0f-5p'
    }
    testNetwork = await mockServer.networks.createNetwork('Test Network', 1, 1, 1, 'https://account.thethingsnetwork.org', loginData)
    testNetwork = await mockServer.networks.retrieveNetwork(testNetwork.id)
  })
  it('Authorize Network', (done) => {
    let options = {
      method: 'GET',
      headers: {
        Host: 'account.thethingsnetwork.org',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': 1,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: '_ga=GA1.2.1423408661.1529510401; intercom-id-pp8esr7h=3ce48655-bbb3-4f3d-b7fd-5384eef20274; session_id=1t7dTAUKrrsEKK; session=eyJ1c2VyIjoiNWIyYTdiMjE2YTQxYWUwMDMwYTkxMWVkIn0=; session.sig=OLx8CmYSbEdI017LEmxJ4ztJBT8'
      },
      url: oauth
    }
    request(options, function (error, response, body) {
      if (error) {
        done(error)
      }
      else {
        console.log(response.statusCode)
        console.log(response.headers)
        console.log(response.request.headers)
        testNetwork.securityData.code = ''
        mockServer.networks.updateNetwork(testNetwork)
          .then((result) => {
            result.should.have.property('securityData')
          }).then(done, done)
      }
    })
  }).timeout(100000)
  it('Verify Network', async () => {
    let actualNetwork = await mockServer.networks.retrieveNetwork(1)
    actualNetwork.name.should.equal('Test Network')
    actualNetwork.networkTypeId.should.equal(1)
    actualNetwork.networkProviderId.should.equal(1)
    actualNetwork.networkProtocolId.should.equal(1)
    actualNetwork.baseUrl.should.equal('https://account.thethingsnetwork.org')
    actualNetwork.securityData.should.have.property('access_token')
    actualNetwork.securityData.should.have.property('token_type')
    actualNetwork.securityData.should.have.property('refresh_token')
    actualNetwork.securityData.should.have.property('expires_in')
    actualNetwork.securityData.should.have.property('authorized')
    actualNetwork.securityData.authorized.should.equal(true)
  })
  it('Get Applications', async () => {
    let actualNetwork = await mockServer.networks.retrieveNetwork(1)
    let ttnProtocol = await mockServer.networkProtocols.retrieveNetworkProtocol(actualNetwork.networkProtocolId)
    let ttn = require('../../rest/networkProtocols/' + ttnProtocol.protocolHandler)
    let session = actualNetwork.securityData
    let app = await ttn.getApplications(session, testNetwork, mockDataAPI)
    app.length.should.equal(2)
  })
})
