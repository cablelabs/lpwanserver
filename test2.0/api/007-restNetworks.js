var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe('Networks', function () {
  var adminToken
  var coAdminToken
  var userToken
  var npId1

  before('User Sessions', function (done) {
    // Wait on server to finish loading
    var items = 0
    var waitFunc = function () {
      ++items
      if (items >= 4) {
        done()
      }
    }
    server
      .post('/api/sessions')
      .send({'login_username': 'admin', 'login_password': 'password'})
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        adminToken = res.text
        waitFunc()
        server
          .post('/api/networkProviders')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({'name': 'Kyrio'})
          .end(function (err, res) {
            if (err) {
              return done(err)
            }
            waitFunc()
          })
      })
    server
      .post('/api/sessions')
      .send({'login_username': 'clAdmin', 'login_password': 'password'})
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        coAdminToken = res.text
        waitFunc()
      })

    server
      .post('/api/sessions')
      .send({'login_username': 'clUser', 'login_password': 'password'})
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        userToken = res.text
        waitFunc()
      })
  })

  var netId1
  var netId2
  describe('POST /api/networks', function () {
    it('Get Network Protocol for Lora OS', function(done) {
      server
        .get('/api/networkProtocols?search=LoRa Server')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          npId1 = result.records[0].id
          done()
        })
    })
    it('should return 403 (forbidden) on coAdmin', function (done) {
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({
          'name': 'Funky network',
          'networkProviderId': 1,
          'networkTypeId': 1,
          'baseURL': 'https://lora_appserver1:8080/api',
          'networkProtocolId': npId1,
          'securityData': {'username': 'admin', 'password': 'admin'}
        })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send({
          'name': 'Funky network',
          'networkProviderId': 1,
          'networkTypeId': 1,
          'baseURL': 'https://lora_appserver1:8080/api',
          'networkProtocolId': npId1,
          'securityData': {'username': 'admin', 'password': 'admin'}
        })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 201 on admin', function (done) {
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'name': 'MachQLoRa',
          'networkProviderId': 1,
          'networkTypeId': 1,
          'baseUrl': 'https://localhost:9999/api',
          'networkProtocolId': npId1
        })
        .end(function (err, res) {
          console.log(res.text)
          res.should.have.status(201)
          var ret = JSON.parse(res.text)
          netId2 = ret.id
          done()
        })
    })

    it('should return 201 on admin', function (done) {
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'name': 'Funky network',
          'networkProviderId': 1,
          'networkTypeId': 1,
          'baseUrl': 'https://lora_appserver1:8080/api/',
          'networkProtocolId': npId1,
          'securityData': {'username': 'admin', 'password': 'admin'}
        })
        .end(function (err, res) {
          res.should.have.status(201)
          var ret = JSON.parse(res.text)
          netId1 = ret.id
          ret.should.have.property('baseUrl')
          ret.baseUrl.should.equal('https://lora_appserver1:8080/api')
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('Funky network')
          netObj.baseUrl.should.equal('https://lora_appserver1:8080/api')
          done()
        })
    })
  })

  describe('GET /api/networks (search/paging)', function () {
    it('should return 200 with 2 networks on coAdmin', function (done) {
      server
        .get('/api/networks')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 2 networks on user', function (done) {
      server
        .get('/api/networks')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 2 networks on admin', function (done) {
      server
        .get('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(2)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 1 network on admin, limit 2, offset 1', function (done) {
      server
        .get('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({'limit': 2, 'offset': 1})
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(2)
          done()
        })
    })

    it('should return 200 with 1 network on admin, search %Funky%', function (done) {
      server
        .get('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({'search': '%Funky%'})
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/networks/{id}', function () {
    it('should return 200 on coAdmin', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('Funky network')
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('Funky network')
          done()
        })
    })
  })

  describe('PUT /api/networks', function () {
    it('should return 403 (forbidden) on coAdmin - not my network', function (done) {
      server
        .put('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send('{ "id": ' + netId1 + ', "name": "KyrioLoRa" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user - not my network', function (done) {
      server
        .put('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "KyrioLoRa" }')
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .put('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"name": "KyrioLoRa" }')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on get with new network name', function (done) {
      server
        .get('/api/networks/' + netId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var netObj = JSON.parse(res.text)
          netObj.name.should.equal('KyrioLoRa')
          done()
        })
    })
  })

  describe('DELETE /api/networks', function () {
    it('should return 403 (forbidden) on coAdmin', function (done) {
      server
        .delete('/api/networks/' + netId2)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .delete('/api/networks/' + netId2)
        .set('Authorization', 'Bearer ' + userToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 204 on admin', function (done) {
      server
        .delete('/api/networks/' + netId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/networks/' + netId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(404)
          done()
        })
    })
  })
})
