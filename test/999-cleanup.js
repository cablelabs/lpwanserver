var assert = require('assert');
var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../restApp.js');
var should = chai.should();

chai.use( chaiHttp );
var server = chai.request(app).keepOpen();

describe( "Cleanup", function() {
    var adminToken;
    var coAdminToken;
    var userToken;

    before( 'User Sessions', function( done ) {
        var sessions = 0;
        server
        .post( '/api/sessions' )
        .send( { "login_username": "admin", "login_password": "password" } )
        .end( function( err, res ) {
            if ( err ) {
                return done( err );
            }
            adminToken = res.text;
            done();
        });
    });

    var recs = [];
    describe( "CLEAN /api/devices", function() {
        it('GET ALL DEVICES', function( done ) {
            server
            .get('/api/devices')
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                console.log( "Got " + result.records.length + " devices to DELETE" );
                recs = result.records;
                done();
            });
        });
        var recsDeleted = 0;
        it( 'DELETE ALL DEVICES', function( done ) {
            recs.map( function( rec ) {
                console.log( "Deleting device " + rec.id );
                server
                .delete('/api/devices/' + rec.id )
                .set('Authorization', 'Bearer ' + adminToken )
                .end(function(err, res){
                    res.should.have.status(204);
                    ++recsDeleted;
                    if ( recsDeleted == recs.length ) {
                        done();
                    }
                });
            });
        });
    });

    describe( "CLEAN /api/deviceProfiles", function() {
        it('GET ALL DEVICE PROFILES', function( done ) {
            server
            .get('/api/deviceProfiles')
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                console.log( "Got " + result.records.length + " deviceProfiles to DELETE" );
                recs = result.records;
                done();
            });
        });
        var recsDeleted = 0;
        it( 'DELETE ALL DEVICE PROFILES', function( done ) {
            recs.map( function( rec ) {
                console.log( "Deleting deviceProfile " + rec.id );
                server
                .delete('/api/deviceProfiles/' + rec.id )
                .set('Authorization', 'Bearer ' + adminToken )
                .end(function(err, res){
                    res.should.have.status(200);
                    ++recsDeleted;
                    if ( recsDeleted == recs.length ) {
                        done();
                    }
                });
            });
        });
    });

    describe( "CLEAN /api/companyNetworkTypeLinks", function() {
        it('GET ALL COMPANYNETWORKTYPELINKS', function( done ) {
            server
            .get('/api/companyNetworkTypeLinks')
            .set('Authorization', 'Bearer ' + adminToken )
            .set('Content-Type', 'application/json')
            .end(function(err, res){
                res.should.have.status(200);
                var result = JSON.parse( res.text );
                result.records.should.be.instanceof( Array );
                console.log( "Got " + result.records.length + " companyNetworkTypeLinks to DELETE" );
                recs = result.records;
                done();
            });
        });
        var recsDeleted = 0;
        it( 'DELETE ALL COMPANYNETWORKTYPELINKS', function( done ) {
            recs.map( function( rec ) {
                console.log( "Deleting companyNetworkTypeLink " + rec.id );
                server
                .delete('/api/companyNetworkTypeLinks/' + rec.id )
                .set('Authorization', 'Bearer ' + adminToken )
                .end(function(err, res){
                    res.should.have.status(200);
                    ++recsDeleted;
                    if ( recsDeleted == recs.length ) {
                        done();
                    }
                });
            });
        });
    });

});
