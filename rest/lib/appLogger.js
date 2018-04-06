// Centralized logging system for the REST application.
var restCallLogger = require('morgan');
var nconf = require('nconf');
var stackTrace = require('stack-trace');

var loggingEnabled;
var loggingHeaders;

exports.initRESTCallLogger = function( app ) {
    var logFormat = nconf.get( "log_format_morgan" );
    if ( logFormat ) {
        app.use( restCallLogger( logFormat ) );
    }

    // Also init whether we do general logging
    loggingEnabled = nconf.get( "logging_enabled" );
    loggingHeaders = nconf.get( "logging_headers" );
}

exports.log = function( msg ) {
    if ( loggingEnabled ) {
        var headers = "";
        if ( loggingHeaders ) {
            var date = new Date().toISOString();
            var frame = stackTrace.get()[1];
            var method = frame.getFunctionName();
            var line = frame.getLineNumber();
            var file = frame.getFileName().replace(/^.*[\\\/]/, '');

            headers = "[" + date + "] " +
                         file + ":" +
                         line + ": ";
        }

        if (typeof msg == 'object') {
            console.log( headers + JSON.stringify(msg));
        }
        else {
            console.log( headers +
                msg );
        }
    }
}
