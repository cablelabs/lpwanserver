var assert = require('assert')
var fs = require('fs')
var chai = require('chai')
var chaiHttp = require('chai-http')
const { createApp } = require('../../../app/rest-server/app')
var should = chai.should()

chai.use(chaiHttp)
var server

/**
 * @test
 */
describe('Launch Applications', function () {
  var adminToken

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    let res = await server
      .post('/api/sessions')
      .send({ 'username': 'admin', 'password': 'password' })
    adminToken = res.text
  })

  var appIds
  describe('GET /api/applications to launch', function () {
    it('should return 200 with array of applications on admin', function (done) {
      server
        .get('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.records.should.be.instanceof(Array)
          appIds = result.records.filter(x => x.baseUrl).map(x => x.id)
          done()
        })
    })
  })

  describe('enable application', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/applications/' + appIds[ 0 ])
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ enabled: true })
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })
  })

  describe.skip('POST /api/applications/{id}/test to test', function () {
    var testData = { 'SomeData': 'toBePassed' }
    it('should return 204 on admin', function (done) {
      server
        .post('/api/applications/' + appIds[ 0 ] + '/test')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(testData)
        .end(function (err, res) {
          res.should.have.status(204)
          fs.existsSync('receivedPostData.txt').should.be.true
          fs.readFileSync('receivedPostData.txt').toString().should.equal(JSON.stringify(testData))
          done()
        })
    })
  })

  describe('disable application', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/applications/' + appIds[ 0 ])
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ enabled: false })
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })
  })
})
