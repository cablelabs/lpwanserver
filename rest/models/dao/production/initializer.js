// Configuration access.
var nconf = require('nconf');

// Database implementation.
var db = require("../../../lib/dbsqlite.js");

//******************************************************************************
// Initialize the production REST library
//******************************************************************************
exports.init = function() {
    // Open the database.
    db.open( nconf.get( "db_create" ) );
}
