const EventEmitter = require('events')
const uuidv4 = require('uuid/v4')

/***************************************************************************
 * This file outlines the API used by the upper layers to communicate with
 * a remote network.  Use this as a starting point to guide development of
 * support of a new networkProtocol.
 ***************************************************************************/
module.exports = class NetworkProtocol extends EventEmitter {
  // *******************************************************************
  // Utility Methods
  // *******************************************************************
  submitUplink (args) {
    return new Promise((resolve, reject) => {
      let id = uuidv4()
      this.once(`uplink:fail:${id}`, reject)
      this.once(`uplink:ok:${id}`, resolve)
      this.emit('uplink', { id, args })
    })
  }
  // *******************************************************************
  // Session Methods
  // *******************************************************************
  async connect () {}
  async disconnect () {}
  async test () {}
  // *******************************************************************
  // Application Methods
  // *******************************************************************
  async listAllApplications () {}
  async createApplication () {}
  async updateApplication () {}
  async removeApplication () {}
  async startApplication () {}
  async stopApplication () {}
  async buildApplication () {}
  // *******************************************************************
  // Device Profile Methods
  // *******************************************************************
  async listAllDeviceProfiles () {}
  async createDeviceProfile () {}
  async updateDeviceProfile () {}
  async removeDeviceProfile () {}
  async buildDeviceProfile () {}
  // *******************************************************************
  // Device Methods
  // *******************************************************************
  async listAllApplicationDevices () {}
  async createDevice () {}
  async updateDevice () {}
  async removeDevice () {}
  async buildDevice () {}
  async handleUplink (args) {
    return this.submitUplink(args)
  }
  async passDataToDevice () {}
}
