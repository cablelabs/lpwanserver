var assert = require('assert')
var fs = require('fs')
var chai = require('chai')
var chaiHttp = require('chai-http')
var restserver = require('../../restApp.js')
var should = chai.should()

chai.use(chaiHttp)
var server = chai.request(restserver).keepOpen()

/**
 * @test
 */
describe('Launch Applications', function () {
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

  var appIds = []
  describe('GET /api/applications to launch', function () {
    it('should return 200 with array of applications on coAdmin', function (done) {
      server
        .get('/api/applications')
        .set('Authorization', 'Bearer ' + coAdminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          result.records.forEach(function (app) {
            appIds.push(app.id)
          })
          done()
        })
    })
  })

  describe('POST /api/applications/{id}/start to launch', function () {
    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications/' + appIds[ 0 ] + '/start')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
  })

  describe.skip('POST /api/applications/{id}/test to test', function () {
    var testData = { 'SomeData': 'toBePassed' }
    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications/' + appIds[ 0 ] + '/test')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(testData)
        .end(function (err, res) {
          res.should.have.status(200)
          fs.existsSync('receivedPostData.txt').should.be.true
          fs.readFileSync('receivedPostData.txt').toString().should.equal(JSON.stringify(testData))
          done()
        })
    })
  })

  describe('POST /api/applications/{id}/stop to quit', function () {
    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications/' + appIds[ 0 ] + '/stop')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var logs = JSON.stringify(res.body)
          logs.indexOf('Error').should.equal(-1)
          done()
        })
    })
  })

  describe('POST /api/applications/{id}/stop again should fail', function () {
    it('should return 200 on admin, but with 404 in returned logs', function (done) {
      server
        .post('/api/applications/' + appIds[ 0 ] + '/stop')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var logs = JSON.stringify(res.body)
          console.log(logs)
          done()
        })
    })
  })
})
