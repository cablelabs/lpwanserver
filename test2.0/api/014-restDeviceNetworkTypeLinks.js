var assert = require('assert');
var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../restApp.js');
var should = chai.should();

chai.use( chaiHttp );
var server = chai.request(app).keepOpen();

describe.skip( "DeviceNetworkTypeLinks", function() {
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

    var dnlId1;
    var dnlId2;
    describe( "POST /api/deviceNetworkTypeLinks", function() {
        it('should return 403 (forbidden) on user', function( done ) {
            server
            .post('/api/deviceNetworkTypeLinks')
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .send( { "deviceId": 1,
                     "networkTypeId": 1,
                     "deviceProfileId": 1,
                     "networkSettings": { "devEUI": "0080000000000102",
                                          "appKey": "11223344556677889900112233445566", } } )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 200 on coAdmin', function( done ) {
            server
            .post('/api/deviceNetworkTypeLinks')
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .send( { "deviceId": 1,
                     "networkTypeId": 1,
                     "deviceProfileId": 1,
                     "networkSettings": { "devEUI": "0080000000000102",
                                          "appKey": "11223344556677889900112233445566", }
                  } )
            .end(function(err, res){
                res.should.have.status(200);
                var dnlObj = JSON.parse( res.text );
                dnlId1 = dnlObj.id;
                done();
            });
        });

        it('should return 200 on admin', function( done ) {
            server
            .post('/api/deviceNetworkTypeLinks')
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send( { "deviceId": 1,
                     "networkTypeId": 2,
                     "deviceProfileId": 1,
                     "networkSettings": { "devEUI": "0080000000000103",
                                          "appKey": "11223344556677889900112233445567", } } )
            .end(function(err, res){
                res.should.have.status(200);
                var dnlObj = JSON.parse( res.text );
                dnlId2 = dnlObj.id;
                done();
            });
        });

        it('should return 200 on get', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send()
            .end(function(err, res){
                res.should.have.status(200);
                var dnlObj = JSON.parse( res.text );
                dnlObj.deviceId.should.equal( 1 );
                dnlObj.networkTypeId.should.equal( 1 );
                done();
            });
        });

    });

    describe( "GET /api/deviceNetworkTypeLinks (search/paging)", function() {
        it('should return 200 with 1 deviceNetworkTypeLink on coAdmin', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks' )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                result.records.should.have.length( 2 );
                result.totalCount.should.equal( 2 );
                done();
            });
        });

        it('should return 200 on user', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks' )
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                result.records.should.have.length( 2 );
                result.totalCount.should.equal( 2 );
                done();
            });
        });

        it('should return 200 with 2 deviceNetworkTypeLinks on admin', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks' )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                result.records.should.have.length( 2 );
                result.totalCount.should.equal( 2 );
                done();
            });
        });

        it('should return 200 with 1 deviceNetworkTypeLink on admin, limit 2, offset 1', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks' )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .query( { "limit": 2, "offset": 1 } )
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                result.records.should.have.length( 1 );
                result.totalCount.should.equal( 2 );
                done();
            });
        });

    });

    describe( "GET /api/deviceNetworkTypeLinks/{id}", function() {
        it('should return 200 on coAdmin', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                done();
            });
        });

        it('should return 200 on user', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                done();
            });
        });

        it('should return 200 on admin', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var ret = JSON.parse( res.text );
                ret.id.should.equal( dnlId1 );
                done();
            });
        });

        it('should return 200 on get', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send()
            .end(function(err, res){
                res.should.have.status(200);
                var appObj = JSON.parse( res.text );
                appObj.deviceId.should.equal( 1 );
                appObj.deviceProfileId.should.equal( 1 );
                appObj.networkTypeId.should.equal( 1 );
                done();
            });
        });

        it('should return 200 on get', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send()
            .end(function(err, res){
                res.should.have.status(200);
                var appObj = JSON.parse( res.text );
                appObj.deviceId.should.equal( 1 );
                appObj.deviceProfileId.should.equal( 1 );
                appObj.networkTypeId.should.equal( 1 );
                done();
            });
        });

        it('should return 200 on coAdmin getting my application', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                done();
            });
        });

        it('should return 200 on user getting my application', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                done();
            });
        });
    });

    describe( "PUT /api/deviceNetworkTypeLinks", function() {
        it('should return 204 on coAdmin', function( done ) {
            server
            .put('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + coAdminToken )
            .set('Content-Type', 'application/json')
            .send( { "networkSettings": { "devEUI": "0080000000000102",
                                          "appKey": "11223344556677889900112233445568", } } )
            .end(function(err, res){
                res.should.have.status(204);
                done();
            });
        });

        it('should return 403 (forbidden) on user', function( done ) {
            server
            .put('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + userToken )
            .set('Content-Type', 'application/json')
            .send( { "networkSettings": { "devEUI": "0080000000000102",
                                          "appKey": "11223344556677889900112233445569",  } } )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 204 on admin', function( done ) {
            server
            .put('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send( { "networkSettings": { "devEUI": "0080000000000102",
                                          "appKey": "1122334455667788990011223344556a", } } )
            .end(function(err, res){
                res.should.have.status(204);
                done();
            });
        });

        it('should return 200 on get with new networkSettings', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId1 )
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .send()
            .end(function(err, res){
                res.should.have.status(200);
                var appObj = JSON.parse( res.text );
                appObj.networkSettings.appKey.should.equal( "1122334455667788990011223344556a" );
                done();
            });
        });

    });

    describe( "DELETE /api/deviceNetworkTypes", function() {
        it('should return 403 (forbidden) on user', function( done ) {
            server
            .delete('/api/deviceNetworkTypeLinks/' + dnlId2)
            .set('Authorization', 'Bearer ' + userToken )
            .end(function(err, res){
                res.should.have.status(403);
                done();
            });
        });

        it('should return 204 on admin', function( done ) {
            server
            .delete('/api/deviceNetworkTypeLinks/' + dnlId2)
            .set('Authorization', 'Bearer ' + adminToken )
            .end(function(err, res){
                res.should.have.status(204);
                done();
            });
        });

        it('should return 404 on get', function( done ) {
            server
            .get('/api/deviceNetworkTypeLinks/' + dnlId2 )
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
