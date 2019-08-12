//* *****************************************************************************
// The Session interface.
//
// The session interface keeps track of the client's resources in use,
// especially their connections to remote networks
//* *****************************************************************************
module.exports = class Session {
  constructor (token) {
    this.jwtToken = token
    this.networkSessions = []
  }

  addConnection (name, connection, api) {
    this.networkSessions.push({ name, connection, api })
  }

  async dropConnections () {
    await Promise.all(this.networkSessions.map(x => x.api.disconnect(x.connection)))
  }
}
