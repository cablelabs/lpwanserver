var appLogger = require( "../lib/appLogger.js" );

// Configuration access.
var nconf = require('nconf');

var modelAPI;

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
function CompanyNetworkTypeLink( server ) {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/companyNetworkTypeLinks.js' );

    modelAPI = server;
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
            var logs = await modelAPI.networkTypeAPI.addCompany( networkTypeId, companyId, networkSettings );
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
            var logs = await modelAPI.networkTypeAPI.pushCompany( rec.networkTypeId, rec.companyId, rec.networkSettings );
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
            // Delete applicationNetworkTypeLinks
            let antls = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks( { companyId: rec.companyId } );
            let recs = antls.records;
            for ( let i = 0; i < recs.length; ++i ) {
                await modelAPI.applicationNetworkTypeLinks.deleteApplicationNetworkTypeLink( recs[ i ].id );
            }
            // Don't delete the local record until the remote operations complete.
            var logs = await modelAPI.networkTypeAPI.deleteCompany( rec.networkTypeId, rec.companyId );
            await me.impl.deleteCompanyNetworkTypeLink( id );
            resolve( logs );
        }
        catch ( err ) {
            appLogger.log( "Error deleting companyNetworkTypeLink: " + err );
            reject( err );
        }
    });
}



// Push the CompanyNetworkTypeLink record.
//
// CompanyNetworkTypeLink - the record to be pushed.  Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - The id of the company this application SHOULD be
//                           part of.  Usually this is tied to the user
//                           creating the link, though a global admin could
//                           supply null here (no need to validate).
//
// Returns a promise that executes the update.
CompanyNetworkTypeLink.prototype.pushCompanyNetworkTypeLink = function( companyNetworkTypeLink, validateCompanyId ) {
    var me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            var rec = await me.impl.retrieveCompanyNetworkTypeLink( companyNetworkTypeLink );

            //push applicationNetworkTypeLinks
            let antls = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks( { companyId: rec.companyId } );
            let recs = antls.records;
            for ( let i = 0; i < recs.length; ++i ) {
                await modelAPI.applicationNetworkTypeLinks.pushApplicationNetworkTypeLink(recs[i].id);
            }
            var logs = await modelAPI.networkTypeAPI.pushCompany( rec.networkTypeId, rec.companyId, rec.networkSettings );
            rec.remoteAccessLogs = logs;
            resolve( rec );
        }
        catch ( err ) {
            appLogger.log( "Error updating companyNetworkTypeLink: " + err );
            reject( err );
        }
    });
}



// Pull the companyNetworkTypeLinks record.
//
// companyNetworkTypeLinks - the record to be pushed.  Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
//
// Returns a promise that executes the update.
CompanyNetworkTypeLink.prototype.pullCompanyNetworkTypeLink = function( networkTypeId  ) {
    return new Promise( async function( resolve, reject ) {
        try {
            var logs = await modelAPI.networkTypeAPI.pullCompany( networkTypeId );
            let companies = JSON.parse(logs[Object.keys(logs)[0]].logs);
            for (var index in companies.result) {
                let company = companies.result[index];
                //see if it exists first
                let existingCompany = await modelAPI.companies.retrieveCompanies({search: company.name});
                if (existingCompany.totalCount > 0 ) {
                    existingCompany = existingCompany.results[0];
                    console.log(company.name + ' already exists');
                }
                else {
                    console.log('creating ' + company.name);
                    existingCompany = await modelAPI.companies.createCompany(company.name, modelAPI.companies.COMPANY_VENDOR);
                }
                //see if it exists first
                let existingCompanyNTL = await modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks({companyId: existingCompany.id});
                if (existingCompanyNTL.totalCount > 0 ) {
                    console.log(company.name + ' link already exists');
                }
                else {
                    console.log('creating Network Link for ' + company.name);
                    modelAPI.companyNetworkTypeLinks.createCompanyNetworkTypeLink(existingCompany.id, networkTypeId, {})
                }

            }

            resolve( logs );
        }
        catch ( err ) {
            appLogger.log( "Error pulling companies from Network : " + networkTypeId + " " + err );
            reject( err );
        }
    });
};



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
