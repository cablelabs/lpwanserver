const config = require('../config')
const jwt = require('jsonwebtoken')
const httpError = require('http-errors')
const Session = require('./session.js')

//* *****************************************************************************
// The Session Manager interface.
//
// The session manager interface uses the User interface to verify a user's
// username and password.  It then passes off the session to the caller to keep
// track of.  Note that session objects also keep track of connections to
// remote networks.
//
// users - The user interface to use to log in users.
//* *****************************************************************************
module.exports = class SessionManager {
  constructor (users) {
    this.users = users
    this.jwtoptions = {
      algorithm: config.get('jwt_algo'),
      expiresIn: config.get('jwt_ttl'),
      issuer: config.get('jwt_issuer')
    }
    this.secret = config.get('jwt_secret')
    this.sessionsMap = {}
  }

  /**
   * Authorize the user.  (a.k.a., login)
   *
   * Expects to get a request with a json body with 2 fields:
   * login_username - the user's name
   * login_password - the user's password.
   *
   * Due to the open nature of the login process, we expect the pathway to the
   * server to be ssl protected.
   *
   * returns - a Promise that executes the functionality.  resolved if the
   *           username and password are valid, rejected otherwise with an
   *           appropriate error.
   */
  async authorize (req) {
    if (!req.body.login_username || !req.body.login_password) {
      throw new httpError.BadRequest()
    }
    const user = await this.users.authorizeUser(req.body.login_username, req.body.login_password)
    // Make JWT token.  We'll just put in the username and look
    // everything else up when called.
    var token = jwt.sign(
      { user: user.username },
      this.secret,
      this.jwtoptions
    )

    // Create a session for the token and any remote network logins
    var session = new Session(token)

    // Save the session in the sessionsMap.
    this.sessionsMap[ user.id ] = session

    // Pass back the token.
    return session.jwtToken
  }

  /**
   * Log out the current user.
   *
   * JWT doesn't really have a concept of "logging out".  Just token expiration.
   * But we'll keep this method here in case we decide to have a cache of known
   * sessions, or if we someday decide to change the implementation to support
   * a more traditional login/logout model.
   *
   * Returns a promise that does nothing.
   */
  async delete (req) {
    // There's really nothing we can do to kill a JWT token itself.  And we
    // don't really want to, in case we get restarted in the middle of active
    // sessions.  But let's end remote connections to the networks we are
    // connected to and remove the session data from the sessionsMap.
    var s = this.sessionsMap[ req.user.id ]
    if (s) await s.dropConnections()
    delete this.sessionsMap[ req.user.id ]
  }

  /**
   * Verifies that the current request has a valid login.  This method
   * (1) verifies that the Authorization header in the request object is of the
   * format "Bearer <token>", where the token is a JWT token returned by
   * authorize(), and
   * (2) verifies that the token is valid, and
   * (3) adds the user record based on the username in the token to the request
   *     object as a user object.
   *
   * This is an unusual method for the API in that it does not return a Promise.
   * It executes and either passes on to the next step in the processing chain
   * via next, or end the request with a 401 error.
   */
  async verifyAuthorization (req, res, next) {
    try {
      var token = req.headers.authorization.replace('Bearer ', '')
      var verified = jwt.verify(token, this.secret)
      // Assuming the verified data due to encryption is enough.
      // Get the user record into the request structure for use in the
      // methods.
      const user = await this.users.loadByUsername(verified.user)
      req.user = user
      // Make sure we have a session for this user.
      if (!this.sessionsMap[ user.id ]) {
        this.sessionsMap[ user.id ] = new Session(token)
      }
      next()
    }
    catch (err) {
      console.error(err.message)
      res.status(401)
      res.send()
    }
  }
}
