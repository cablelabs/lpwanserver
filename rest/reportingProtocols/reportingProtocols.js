//* *****************************************************************************
// Defines a generic API for using protocols, and keeps them loaded for reuse.
// Note that this methodology implies a restart is required if reportingProtocol
// code is changed.
//* *****************************************************************************

function ReportingProtocolAccess (reportingProtocolDB) {
  this.rpDB = reportingProtocolDB
  this.reportingProtocolMap = {}
}

// Resets the entire protocol map.
ReportingProtocolAccess.prototype.clearProtocolMap = function () {
  this.reportingProtocolMap = {}
}

// Clears the protocol from the protocol map. Should be called if the reporting
// protocol is updated with a new code, or is deleted.
ReportingProtocolAccess.prototype.clearProtocol = function (reportingProtocol) {
  let id = reportingProtocol.id
  if (this.reportingProtocolMap[ id ]) {
    delete this.reportingProtocolMap[ id ]
  }
}

ReportingProtocolAccess.prototype.getProtocol = function (application) {
  let me = this
  return new Promise(async function (resolve, reject) {
    let id = application.reportingProtocolId
    if (!me.reportingProtocolMap[ id ]) {
      // We'll need the protocol for the network.
      try {
        let rp = await me.rpDB.retrieveReportingProtocol(id)
        me.reportingProtocolMap[ id ] = require('./' + rp.protocolHandler)
        resolve(me.reportingProtocolMap[ id ])
      }
      catch (err) {
        console.log('Error loading reportingProtocol: ' + err)
        reject(err)
      }
    }
    else {
      resolve(me.reportingProtocolMap[ id ])
    }
  })
}

module.exports = ReportingProtocolAccess
