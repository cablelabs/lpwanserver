// Main application, loaded from bin/rest
//
// This module handles translating REST requests to the methods that handle
// those operations.  This module also manages the login sessions and
// permissions required to execute the various operations.

var express = require('express');
var http = require( 'http' );
var https = require('https');
var cors = require('cors');
// var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var session = require('express-session');
var fs = require( 'fs' );
var server = require( './rest/restServer.js' );
var appLogger = require( './rest/lib/appLogger.js' )
var nconf = require('nconf')

// Catch unhandled promise rejections.
process.on( 'unhandledRejection', (reason, p) => {
    console.log( 'Unhandled Promise Rejection at: Promise ', p, ' reason: ', reason );
    console.log( 'Stack:', reason.stack );
  // application specific logging, throwing an error, or other logic here
});

// Set up config data access.
require('./config')
console.log('variables', nconf.get('NODE_ENV'), nconf.get('port'), nconf.get('foo'))

// Create the REST application.
var app = express();

// Load the port binding info.
var ipPort = nconf.get( "port" );

// Load the ssl config
var sslkeyName = nconf.get( "ssl_key_file" );
var sslcertName = nconf.get( "ssl_cert_file" );

console.log(sslkeyName);
console.log(sslcertName);

if ( sslkeyName && sslcertName ){
    // Load the files
    var sslcert = fs.readFileSync( sslcertName );
    var sslkey = fs.readFileSync( sslkeyName );
    // Set up an SSL connection
    var sslOpts = {
        key: sslkey,
        cert: sslcert,
    };
    https.createServer( sslOpts, app ).listen({
        port: ipPort,
        exclusive: true,
    });
    console.log( "REST https server starting on port " + ipPort );
}
else {
    http.createServer( app ).listen({
        port: ipPort,
        exclusive: true,
    });
    console.log( "REST http server starting on port " + ipPort );
    console.log( "WARNING: INSECURE CONNECTION" );
}

app.on('error', onError);
app.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// NOTE: if we didn't set up ssl endpoint above,

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
