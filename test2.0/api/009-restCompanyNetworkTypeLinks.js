var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe.skip('CompanyNetworkTypeLink', function () {
  var adminToken
  var coAdminToken
  var userToken

  before('User Sessions', function (done) {
    var sessions = 0
    var waitFunc = function () {
      ++sessions
      if (sessions >= 3) {
        done()
      }
    }
    server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        adminToken = res.text
        waitFunc()
      })

    server
      .post('/api/sessions')
      .send({ 'login_username': 'clAdmin', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        coAdminToken = res.text
        waitFunc()
      })

    server
      .post('/api/sessions')
      .send({ 'login_username': 'clUser', 'login_password': 'password' })
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        userToken = res.text
        waitFunc()
      })
  })

  var cntl
  var cnlId1
  var cnlId2
  describe('POST /api/companyNetworkTypeLinks', function () {
    it('should return 403 (forbidden) on user', function (done) {
      server
        .post('/api/companyNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send({ 'companyId': 2,
          'networkTypeId': 1,
          'networkSettings': '{ "foo": "bar" }' })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 403 on coAdmin with another company', function (done) {
      server
        .post('/api/companyNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({ 'companyId': 1,
          'networkTypeId': 1,
          'networkSettings': { 'foo': 'bar' } })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on coAdmin', function (done) {
      server
        .post('/api/companyNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({ 'companyId': 2,
          'networkTypeId': 1,
          'networkSettings': { 'foo': 'bar' } })
        .end(function (err, res) {
          console.log(res.text)
          var ret = res.text
          cnlId1 = ret.id
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/companyNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'companyId': 2,
          'networkTypeId': 2,
          'networkSettings': { 'bizz': 'buzz' } })
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          cnlId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/companyNetworkTypeLinks/' + cnlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var cnlObj = JSON.parse(res.text)
          cnlObj.companyId.should.equal(2)
          cnlObj.networkTypeId.should.equal(1)
          done()
        })
    })
  })

  describe('GET /api/companyNetworkTypeLinks (search/paging)', function () {
    it('should return 200 with 2 companyNetworkTypeLinks on coAdmin', function (done) {
      server
        .get('/api/companyNetworkTypeLinks')
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

    it('should return 200 on user', function (done) {
      server
        .get('/api/companyNetworkTypeLinks')
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

    it('should return 200 with 2 companyNetworkTypeLinks on admin', function (done) {
      server
        .get('/api/companyNetworkTypeLinks')
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

    it('should return 200 with 1 companyNetworkTypeLink on admin, limit 2, offset 1', function (done) {
      server
        .get('/api/companyNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .query({ 'limit': 2, 'offset': 1 })
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.should.have.length(1)
          result.totalCount.should.equal(2)
          done()
        })
    })
  })

  describe('GET /api/companyNetworkTypeLinks/{id}', function () {
    it('should return 200 on coAdmin', function (done) {
      server
        .get('/api/companyNetworkTypeLinks/' + cnlId2)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user', function (done) {
      server
        .get('/api/companyNetworkTypeLinks/' + cnlId2)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/companyNetworkTypeLinks/' + cnlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ret.id.should.equal(cnlId2)
          ret.companyId.should.equal(2)
          ret.networkTypeId.should.equal(2)
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/companyNetworkTypeLinks/' + cnlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var cnlObj = JSON.parse(res.text)
          cnlObj.companyId.should.equal(2)
          cnlObj.networkTypeId.should.equal(1)
          done()
        })
    })
  })

  describe('PUT /api/companyNetworkTypeLinks', function () {
    it('should return 200 on coAdmin', function (done) {
      server
        .put('/api/companyNetworkTypeLinks/' + cnlId2)
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .send({'networkSettings': { 'zoom': 'shwartz' } })
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 403 (forbidden) on user', function (done) {
      server
        .put('/api/companyNetworkTypeLinks/' + cnlId2)
        .set('Authorization', 'Bearer ' + userToken)
        .set('Content-Type', 'application/json')
        .send({'networkSettings': { 'some': 'thing' } })
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .put('/api/companyNetworkTypeLinks/' + cnlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({'networkSettings': { 'zoom': 'bafigliano' } })
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('DELETE /api/companyNetworkTypeLinks', function () {
    it('should return 403 (forbidden) on user', function (done) {
      server
        .delete('/api/companyNetworkTypeLinks/' + cnlId1)
        .set('Authorization', 'Bearer ' + userToken)
        .end(function (err, res) {
          res.should.have.status(403)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .delete('/api/companyNetworkTypeLinks/' + cnlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })

    it('should return 404 on get', function (done) {
      server
        .get('/api/companyNetworkTypeLinks/' + cnlId2)
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
