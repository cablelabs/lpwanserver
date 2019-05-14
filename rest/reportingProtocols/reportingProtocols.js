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

ReportingProtocolAccess.prototype.getProtocol = async function getProtocol (application) {
  let { id } = application.reportingProtocol
  if (!this.reportingProtocolMap[ id ]) {
    // We'll need the protocol for the network.
    try {
      let rp = await this.rpDB.load(id)
      this.reportingProtocolMap[ id ] = require('./' + rp.protocolHandler)
      return this.reportingProtocolMap[ id ]
    }
    catch (err) {
      console.log('Error loading reportingProtocol: ' + err)
      throw err
    }
  }
  return this.reportingProtocolMap[ id ]
}

module.exports = ReportingProtocolAccess
