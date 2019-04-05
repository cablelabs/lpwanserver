// Configuration access.
const config = require('../config')

//* *****************************************************************************
// Initialize the REST library
//* *****************************************************************************

// Class constructor.
//
// Loads the implementation for the initialization interface based on the passed
// subdirectory name.  The implementation file initializer.js is to be found in
// that subdirectory of the models/dao directory (Data Access Object).  It is
// intended to be used to set up any required data or subsystems used by the
// specific implementation prior to starting the system for processing requests.
//
// implPath - The subdirectory to get the dao implementation from.
function Initializer () {
  this.impl = require('./dao/' +
                             config.get('impl_directory') +
                             '/initializer.js')
}

// Initializes the implementation for the dao objects.
//
// Unlike most methods in the model interfaces, this method is expected to
// perform its functionality within the scope of this call.  In other words,
// this method does not return a Promise to be run.  It just runs.
Initializer.prototype.init = function () {
  return this.impl.init()
}

module.exports = Initializer
