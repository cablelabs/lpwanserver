// General libraries in use in this module.
var appLogger = require( '../lib/appLogger.js' );

var request = require('request');

//******************************************************************************
// POSTs the data object as JSON
//******************************************************************************
// Supports the canned API format of reportingProtocols.  Method name is
// "report", taking the parameters:
//
// dataObject - The JSON data object to report
// url        - The URL to report to
// appName    - The application name we are reporting to
//
// Returns a Promise that sends the report.
exports.report = function( dataObject, url, appName ) {
    return new Promise( function( resolve, reject ) {
        // Set up the request options.
        var options = {};
        options.method = 'POST';
        options.uri = url;
        options.headers = {};
        options.headers[ 'Content-Type' ] = "application/json";
        options.headers.appid = appName;
        options.json = dataObject;
        appLogger.log(options)
        request( options, function( error, response, body ) {
            if ( error ) {
                appLogger.log( "Error reporting data (" +
                               JSON.stringify( dataObject ) +
                               ") for " + appName +
                               " to " + url +
                               ": " + error );
                reject( error );
            }
            else {
              appLogger.log(body)
              resolve( response );
            }
        });
    });
}
