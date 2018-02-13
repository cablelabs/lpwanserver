// General libraries in use in this module.
// AppLogger is a conole logger that adds timestamp, filename, and line number
// information.  Usage: appLogger.log( <string> );
var appLogger = require( '../lib/appLogger.js' );

// A library for performing REST requests on a remote server.
var request = require('request');

// The data reporting API, used to pass data receive from a remote network to
// the application server.
//
// dataObject - The JSON data object to report
// url        - The URL to report to
// appName    - The application name we are reporting to
//
// Returns a Promise that sends the report.
exports.report = function( dataObject, url, appName ) {
    // HINT:
    //return new Promise( function( resolve, reject ) {
    //});
}
