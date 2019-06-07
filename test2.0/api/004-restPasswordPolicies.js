var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var createApp = require('../../restApp')
var should = chai.should()
const { prisma } = require('../../prisma/generated/prisma-client')

chai.use(chaiHttp)
var server
let companyId

describe('PasswordPolicies', function () {
  var adminToken

  before('User Sessions', async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    const res = await server
      .post('/api/sessions')
      .send({ 'login_username': 'admin', 'login_password': 'password' })
    adminToken = res.text
    const cos = await prisma.companies({ where: { name: 'SysAdmins' } })
    companyId = cos[0].id
  })

  var ppId1
  var ppId2
  describe('POST /api/passwordPolicies', function () {
    it('should return 200 on admin', function (done) {
      server
        .post('/api/passwordPolicies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'ruleText': 'Must be some number of Zs', 'ruleRegExp': 'Z+', 'companyId': companyId })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ppId1 = ret.id
          done()
        })
    })

    it('should return 400 on creating new account with now invalid password', function (done) {
      server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'test1', 'password': 'test11', 'role': 'USER', 'companyId': companyId })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(400)
          done()
        })
    })

    it('should return 200 on creating new account with now valid password', function (done) {
      server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'test1', 'password': 'ZZZZZZ', 'role': 'USER', 'companyId': companyId })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          var userId = ret.id
          server
            .delete('/api/users/' + userId)
            .set('Authorization', 'Bearer ' + adminToken)
            .set('Content-Type', 'application/json')
            .send()
            .end(function (err, res) {
              if (err) return done(err)
              res.should.have.status(204)
            })
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .post('/api/passwordPolicies')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({ 'ruleText': 'Must be at least 9 characters', 'ruleRegExp': '^\\S{9,}$', 'companyId': companyId })
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ppId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/passwordPolicies/' + ppId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ppObj = JSON.parse(res.text)
          ppObj.ruleText.should.equal('Must be at least 9 characters')
          ppObj.ruleRegExp.should.equal('^\\S{9,}$')
          done()
        })
    })
  })
  describe('GET /api/passwordPolicies', function () {
    it('should return 200 with 3 policies on admin', function (done) {
      server
        .get(`/api/passwordPolicies/company/${companyId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.be.instanceof(Array)
          result.should.have.length(3)
          done()
        })
    })

    it('should return 200 with 1 passwordPolicies on user', function (done) {
      server
        .get(`/api/passwordPolicies/company/${companyId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.be.instanceof(Array)
          result.should.have.length(3)
          done()
        })
    })

    it('should return 200 with 3 passwordPolicy on admin', function (done) {
      server
        .get(`/api/passwordPolicies/company/${companyId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var result = JSON.parse(res.text)
          result.should.be.instanceof(Array)
          result.should.have.length(3)
          done()
        })
    })
  })

  describe('GET /api/passwordPolicies/{id}', function () {
    it('should return 200 on admin', function (done) {
      server
        .get('/api/passwordPolicies/' + ppId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on user', function (done) {
      server
        .get('/api/passwordPolicies/' + ppId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })

    it('should return 200 on admin', function (done) {
      server
        .get('/api/passwordPolicies/' + ppId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          done()
        })
    })
  })

  describe('PUT /api/passwordPolicies', function () {
    it('should return 204 on admin', function (done) {
      server
        .put('/api/passwordPolicies/' + ppId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send('{"ruleText": "Use Ys", "ruleRegExp": "Y+" }')
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })

    it('should return 200 on get with new rule', function (done) {
      server
        .get('/api/passwordPolicies/' + ppId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(200)
          var ppObj = JSON.parse(res.text)
          ppObj.ruleText.should.equal('Use Ys')
          ppObj.ruleRegExp.should.equal('Y+')
          done()
        })
    })
  })

  describe('DELETE /api/passwordPolicies', function () {
    it('should return 204 on admin', function (done) {
      server
        .delete('/api/passwordPolicies/' + ppId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .end(function (err, res) {
          if (err) return done(err)
          res.should.have.status(204)
          done()
        })
    })
  })
})
