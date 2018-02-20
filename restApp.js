// Main application, loaded from bin/rest
//
// This module handles translating REST requests to the methods that handle
// those operations.  This module also manages the login sessions and
// permissions required to execute the various operations.

var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var server = require( './rest/restServer.js' );
var appLogger = require( './rest/lib/appLogger.js' );

// Catch unhandled promise rejections.
process.on( 'unhandledRejection', (reason, p) => {
    console.log( 'Unhandled Promise Rejection at: Promise ', p, ' reason: ', reason );
    console.log( 'Stack:', reason.stack );
  // application specific logging, throwing an error, or other logic here
});

// Set up config data access.
var nconf = require('nconf');
// Priority order for settings: command line, environment vars,
// the file config.js at the project root directory.
nconf.argv().env().file( { file: 'config.hjson', format: require('hjson') } );

// Create the REST application.
var app = express();

// Load the port binding info.
var ipBindAddress = nconf.get( "bind_address" );
var ipPort = nconf.get( "port" );

// Load the ssl config
var sslkey = nconf.get( "ssl_key_file" );
var sslcert = nconf.get( "ssl_cert_file" );

// Add a logger if enabled.
appLogger.initRESTCallLogger( app );

// Add the body parser.
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );

// Add a cookie parser.
app.use( cookieParser() );

// Add the cors manager
var whitelistStr = nconf.get( "cors_whitelist" );
var whitelistRegExp = [];
for ( var i = 0; i < whitelistStr.length; ++i ) {
    whitelistRegExp[ i ] = new RegExp( whitelistStr[ i ] );
}
var corsOptions = {
    origin: function (origin, callback) {
        // Walk the list of regular expressions.
        for ( var i = 0; i < whitelistRegExp.length; ++i ) {
            // If we match, we're good.
            if ( whitelistRegExp[ i ].test( origin ) ) {
                callback(null, true);
                return;
            }
        }
        callback( new Error( 'Not allowed by CORS settings' ) );
    }
}

app.use( cors( corsOptions ) );

// Initialize the application support interfaces.  We pass in the
// application so we can add functions and API endpoints.
var restServer = new server.RestServer( app );


module.exports = app;
