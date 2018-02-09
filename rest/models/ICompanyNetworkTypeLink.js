var appLogger = require( "../lib/appLogger.js" );

// Configuration access.
var nconf = require('nconf');

var networkTypeApi;

//******************************************************************************
// The CompanyNetworkTypeLink interface.
//******************************************************************************
// Class constructor.
//
// Loads the implementation for the companyNetworkTypeLink interface based on the
// configured subdirectory name.  The implementation file companyNetworkTypeLink.js
// is to be found in that subdirectory of the models/dao directory (Data Access
// Object).
//
function CompanyNetworkTypeLink( networkTypeApiImpl ) {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/companyNetworkTypeLinks.js' );

    networkTypeApi = networkTypeApiImpl;
}


// Create the companyNetworkTypeLinks record.
//
// companyId       - The id for the company this link is being created for
// networkTypeId       - The id for the network the company is linked to
// networkSettings - The settings required by the network protocol in json
//                   format
//
// Returns the promise that will execute the create.
CompanyNetworkTypeLink.prototype.createCompanyNetworkTypeLink = function( companyId, networkTypeId, networkSettings ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var rec = await me.impl.createCompanyNetworkTypeLink( companyId, networkTypeId, networkSettings );
            var logs = await networkTypeApi.addCompany( networkTypeId, companyId, networkSettings );
            rec.remoteAccessLogs = logs;
            resolve( rec );
        }
        catch ( err ) {
            appLogger.log( "Error creating companyNetworkTypeLink: " + err );
            reject( err );
        }
    });
}

// Retrieve a companyNetworkTypeLinks record by id.
//
// id - the record id of the companyNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
CompanyNetworkTypeLink.prototype.retrieveCompanyNetworkTypeLink = function( id ) {
    return this.impl.retrieveCompanyNetworkTypeLink( id );
}

// Update the companyNetworkTypeLinks record.
//
// companyNetworkTypeLinks - the updated record.  Note that the id must be unchanged
//                       from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
CompanyNetworkTypeLink.prototype.updateCompanyNetworkTypeLink = function( companyNetworkTypeLink ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var rec = await me.impl.updateCompanyNetworkTypeLink( companyNetworkTypeLink );
            var logs = await networkTypeApi.pushCompany( rec.networkTypeId, rec.companyId, rec.networkSettings );
            rec.remoteAccessLogs = logs;
            resolve( rec );
        }
        catch ( err ) {
            appLogger.log( "Error updating companyNetworkTypeLink: " + err );
            reject( err );
        }
    });
}

// Delete the companyNetworkTypeLinks record.
//
// id - the id of the companyNetworkTypeLinks record to delete.
//
// Returns a promise that performs the delete.
CompanyNetworkTypeLink.prototype.deleteCompanyNetworkTypeLink = function( id ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var rec = await me.impl.retrieveCompanyNetworkTypeLink( id );
            // Don't delete the local record until the remote operations complete.
            var logs = await networkTypeApi.deleteCompany( rec.networkTypeId, rec.companyId );
            await me.impl.deleteCompanyNetworkTypeLink( id );
            resolve( logs );
        }
        catch ( err ) {
            appLogger.log( "Error deleting companyNetworkTypeLink: " + err );
            reject( err );
        }
    });
}

//******************************************************************************
// Custom retrieval functions.
//******************************************************************************

// Retrieves a subset of the companyNetworkTypeLinks in the system given the
// options.
//
// Options include limits on the number of companyNetworkTypeLinks returned, the
// offset to the first companyNetworkTypeLink returned (together giving a paging
// capability), the companyId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
CompanyNetworkTypeLink.prototype.retrieveCompanyNetworkTypeLinks = function( options ) {
    return this.impl.retrieveCompanyNetworkTypeLinks( options );
}

module.exports = CompanyNetworkTypeLink;
