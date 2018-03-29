var appLogger = require( "../lib/appLogger.js" );

// Configuration access.
var nconf = require('nconf');

var protocolDataAccess = require('../networkProtocols/networkProtocolDataAccess');

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
            appLogger.log(companies);
            let nsCoId = [];
            let localCoId = [];
            for (var index in companies.result) {
                let company = companies.result[index];
                //Mapping of Org Ids to Company Ids
                nsCoId.push(company.id);

                //see if it exists first
                let existingCompany = await modelAPI.companies.retrieveCompanies({search: company.name});
                if (existingCompany.totalCount > 0 ) {
                    existingCompany = existingCompany.records[0];
                    appLogger.log(company.name + ' already exists');
                    localCoId.push(existingCompany.id);
                }
                else {
                    appLogger.log('creating ' + company.name);
                    existingCompany = await modelAPI.companies.createCompany(company.name, modelAPI.companies.COMPANY_VENDOR);
                    localCoId.push(existingCompany.id);
                }
                //see if it exists first
                let existingCompanyNTL = await modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks({companyId: existingCompany.id});
                if (existingCompanyNTL.totalCount > 0 ) {
                    appLogger.log(company.name + ' link already exists');
                }
                else {
                    appLogger.log('creating Network Link for ' + company.name);
                    modelAPI.companyNetworkTypeLinks.createCompanyNetworkTypeLink(existingCompany.id, networkTypeId, {region: ''})
                }

            }
            logs = await modelAPI.networkTypeAPI.pullApplication( networkTypeId );
            let applications = JSON.parse(logs[Object.keys(logs)[0]].logs);
            appLogger.log(applications);
            let nsAppId = [];
            let localAppId = [];
            for (var index in applications.result) {
                let application = applications.result[index];
                nsAppId.push(application.id);

                //see if it exists first
                let existingApplication = await modelAPI.applications.retrieveApplications({search: application.name});
                if (existingApplication.totalCount > 0 ) {
                    existingApplication = existingApplication.records[0];
                    localAppId.push(existingApplication.id);
                    appLogger.log(application.name + ' already exists');
                }
                else {
                    appLogger.log('creating ' + JSON.stringify(application));
                    let coIndex = nsCoId.indexOf(application.organizationID);
                    appLogger.log(application.name, application.description, localCoId[coIndex], 1, 'https://locahost:8888')
                    existingApplication = await modelAPI.applications.createApplication(application.name, application.description, localCoId[coIndex], 1, 'http://set.me.to.your.real.url:8888');
                    localAppId.push(existingApplication.id);
                }
                //see if it exists first
                let existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({applicationId: existingApplication.id});
                if (existingApplicationNTL.totalCount > 0 ) {
                    appLogger.log(application.name + ' link already exists');
                }
                else {
                    appLogger.log('creating Network Link for ' + application.name);
                    modelAPI.applicationNetworkTypeLinks.createApplicationNetworkTypeLink(existingApplication.id, networkTypeId, {}, existingApplication.companyId);

                }
            }

            logs = await modelAPI.networkTypeAPI.pullDeviceProfiles( networkTypeId );
            let deviceProfiles = JSON.parse(logs[Object.keys(logs)[0]].logs);
            appLogger.log(JSON.stringify(deviceProfiles));
            let nsDpId = [];
            let localDpId = [];
            for (var index in deviceProfiles.result) {
                let deviceProfile = deviceProfiles.result[index];
                nsDpId.push(deviceProfile.deviceProfileID);
                let networkSettings = await modelAPI.networkTypeAPI.pullDeviceProfile(networkTypeId, deviceProfile.deviceProfileID);
                networkSettings = JSON.parse(networkSettings[Object.keys(logs)[0]].logs);
                networkSettings = networkSettings.deviceProfile;

                //see if it exists first
                let existingDeviceProfile = await modelAPI.deviceProfiles.retrieveDeviceProfiles({search: deviceProfile.name});
                if (existingDeviceProfile.totalCount > 0 ) {
                    existingDeviceProfile = existingDeviceProfile.records[0];
                    localDpId.push(existingDeviceProfile.id);
                    appLogger.log(deviceProfile.name + " " + existingDeviceProfile.id + ' already exists');
                    appLogger.log(JSON.stringify(existingDeviceProfile));
                    existingDeviceProfile.networkSettings = networkSettings;
                    appLogger.log(JSON.stringify(existingDeviceProfile));
                    await modelAPI.deviceProfiles.updateDeviceProfile(existingDeviceProfile);
                }
                else {
                    appLogger.log('creating ' + deviceProfile.name);
                    let coIndex = nsCoId.indexOf(deviceProfile.organizationID);
                    appLogger.log(networkTypeId, localCoId[coIndex], deviceProfile.name, networkSettings);
                    existingDeviceProfile = await modelAPI.deviceProfiles.createDeviceProfile(networkTypeId, localCoId[coIndex], deviceProfile.name, deviceProfile.description, networkSettings )
                    localDpId.push(existingDeviceProfile.id);
                }
            }

            for (var appIndex in nsAppId) {
                logs = await modelAPI.networkTypeAPI.pullDevices( networkTypeId, nsAppId[appIndex] );
                let devices = JSON.parse(logs[Object.keys(logs)[0]].logs);
                appLogger.log(JSON.stringify(devices));
                for (var index in devices.result) {
                    let device = devices.result[index];

                    //see if it exists first
                    let existingDevice = await modelAPI.devices.retrieveDevices({search: device.name});
                    if (existingDevice.totalCount > 0 ) {
                        existingDevice = existingDevice.records[0];
                        appLogger.log(device.name + ' already exists');
                        await existingDevice.updateDevice(existingDevice);
                    }
                    else {
                        appLogger.log('creating ' + JSON.stringify(device));
                        let appIndex = nsAppId.indexOf(device.applicationID);
                        appLogger.log("localAppId[" + appIndex + "] = " + localAppId[appIndex]);
                        existingDevice = await modelAPI.devices.createDevice(device.name, device.description, localAppId[appIndex]);
                    }

                    let existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({deviceId: existingDevice.id});
                    if (existingDeviceNTL.totalCount > 0 ) {
                        appLogger.log(device.name + ' link already exists');
                    }
                    else {
                        appLogger.log('creating Network Link for ' + device.name);
                        let dpIndex = nsDpId.indexOf(device.deviceProfileID);
                        // let coId = protocolDataAccess.prototype.getCompanyByApplicationId(existingDevice.applicationId);

                        let tempApp = await modelAPI.applications.retrieveApplication(localAppId[appIndex]);
                        let coId = tempApp.companyId;

                        modelAPI.deviceNetworkTypeLinks.createDeviceNetworkTypeLink(existingDevice.id, networkTypeId, localDpId[dpIndex], device, coId);
                    }
                }

            }

            resolve( logs );
        }
        catch ( err ) {
            appLogger.log( "Error pulling from Network : " + networkTypeId + " " + err );
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
