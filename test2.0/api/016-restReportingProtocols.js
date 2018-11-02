var assert = require('assert');
var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../restApp.js');
var should = chai.should();

chai.use( chaiHttp );
var server = chai.request(app).keepOpen();

var npId1;
var npId2;

describe( "ReportingProtocols", function() {
    var adminToken;
    var coAdminToken;
    var userToken;

    before( 'User Sessions', function( done ) {
        var sessions = 0;
        var waitFunc = function() {
            ++sessions;
            if ( sessions >= 3 ) {
                done();
            }
        };
        server
        .post( '/api/sessions' )
        .send( { "login_username": "admin", "login_password": "password" } )
        .end( function( err, res ) {
            if ( err ) {
                return done( err );
            }
            adminToken = res.text;
            waitFunc();
        });

        server
        .post( '/api/sessions' )
        .send( { "login_username": "clAdmin", "login_password": "password" } )
        .end( function( err, res ) {
            if ( err ) {
                return done( err );
            }
            coAdminToken = res.text;
            waitFunc();
        });

        server
        .post( '/api/sessions' )
        .send( { "login_username": "clUser", "login_password": "password" } )
        .end( function( err, res ) {
            if ( err ) {
                return done( err );
            }
            userToken = res.text;
            waitFunc();
        });
    });

  describe( "GET /api/reportingProtocolHandlers", function() {
    it('should return 200 on coAdmin', function( done ) {
      server
        .get('/api/reportingProtocolHandlers')
        .set('Authorization', 'Bearer ' + coAdminToken )
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .end(function(err, res){
          res.should.have.status(200);
          let body = JSON.parse(res.text);
          body.should.have.length(2);
          done();
        });
    });

  });

    describe( "POST /api/reportingProtocols", function() {
        it('should return 403 (forbidden) on user', function( done ) {
            server
            .post('/api/passwordPolicies')
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .send( { "name": "LoRa Server", "networkTypeId": 1, "protocolHandler": "LoRaOpenSource.js" } )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 403 on coAdmin', function( done ) {
            server
            .post('/api/reportingProtocols')
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .send( { "name": "LoRa Server", "networkTypeId": 1, "protocolHandler": "LoRaOpenSource.js" }  )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 200 on creating new reporting Protocol with admin account #1', function( done ) {
            server
            .post('/api/reportingProtocols')
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send( { "name": "LoRa Server", "networkTypeId": 1, "protocolHandler": "LoRaOpenSource.js" } )
            .end(function(err, res){
                res.should.have.status(200);
                var ret = JSON.parse( res.text );
                npId1 = ret.id;
                done();
            });
        });

        it('should return 200 on creating new reporting Protocol with admin account #2', function( done ) {
            server
            .post('/api/reportingProtocols')
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send( { "name": "T-Mobile NB-IoT", "networkTypeId": 2, "protocolHandler": "TMobileNBIoT.js" } )
            .end(function(err, res){
                res.should.have.status(200);
                var ret = JSON.parse( res.text );
                npId2 = ret.id;
                done();
            });
        });
    });
    describe( "GET /api/reportingProtocols", function() {
        it('should return 200 with 3 protocols on coAdmin', function( done ) {
            server
            .get('/api/reportingProtocols' )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.should.be.instanceof( Array );
                result.should.have.length( 3 );
                done();
            });
        });

        it('should return 200 with 3 protocols on user', function( done ) {
            server
            .get('/api/reportingProtocols' )
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
              res.should.have.status(200);
              var result = JSON.parse( res.text );
              result.should.be.instanceof( Array );
              result.should.have.length( 3 );
              done();
            });
        });

        it('should return 200 with 3 protocols on admin', function( done ) {
            server
            .get('/api/reportingProtocols' )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
              res.should.have.status(200);
              var result = JSON.parse( res.text );
              result.should.be.instanceof( Array );
              result.should.have.length( 3 );
              done();
            });
        });

        it.skip('should return 200 with 1 protocol search NB-IoT', function( done ) {
            server
            .get('/api/reportingProtocols?search=%NB-IoT%' )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                result.records.should.have.length( 1 );
                result.totalCount.should.equal( 1 );
                done();
            });
        })
        it.skip('should return 200 with 1 protocol limit 1 offset 1', function( done ) {
            server
            .get('/api/reportingProtocols?limit=1&offset=1' )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.should.be.instanceof( Array );
                result.should.have.length( 1 );
                done();
            });
        });
    });

    describe( "GET /api/reportingProtocols/{id}", function() {
        it('should return 200 on coAdmin', function( done ) {
            server
            .get('/api/reportingProtocols/' + npId1 )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                done();
            });
        });

        it('should return 200 on user', function( done ) {
            server
            .get('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                done();
            });
        });

        it('should return 200 on admin', function( done ) {
            server
            .get('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                done();
            });
        });
    });

    describe( "PUT /api/reportingProtocols", function() {
        it('should return 403 (forbidden) on coAdmin', function( done ) {
            server
            .put('/api/reportingProtocols/' + npId1 )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .send( "{\"name\": \"I Hacked Your Networks\" }" )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 403 (forbidden) on user', function( done ) {
            server
            .put('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .send( "{\"name\": \"I Hacked Your Networks\" }" )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 204 on admin', function( done ) {
            server
            .put('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send( "{\"name\": \"Sprint NB-IoT\" }" )
            .end(function(err, res){
                res.should.have.status(204);
                done();
            });
        });

        it('should return 200 on get with new company name', function( done ) {
            server
            .get('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send()
            .end(function(err, res){
                res.should.have.status(200);
                var coObj = JSON.parse( res.text );
                coObj.name.should.equal( "Sprint NB-IoT" );
                done();
            });
        });
    });


    describe( "DELETE /api/reportingProtocols", function() {
        it('should return 204 on admin', function( done ) {
            server
            .delete('/api/reportingProtocols/' + npId1 )
            .set('Authorization', 'Bearer ' + adminToken )
            .end(function(err, res){
                res.should.have.status(204);
                done();
            });
        });
        it('should return 403 on coAdmin', function( done ) {
            server
            .delete('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 403 on user', function( done ) {
            server
            .delete('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + userToken )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 204 on admin', function( done ) {
            server
            .delete('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + adminToken )
            .end(function(err, res){
                res.should.have.status(204);
                done();
            });
        });

        it('should return 404 on get', function( done ) {
            server
            .get('/api/reportingProtocols/' + npId2 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send()
            .end(function(err, res){
                res.should.have.status(404);
                done();
            });
        });

    });
});
