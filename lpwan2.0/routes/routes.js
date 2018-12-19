const routes = require('express').Router()
const applications = require('./application')
const deviceProfiles = require('./device-profile')
const devices = require('./device')
const networks = require('./network')
const networkProtocols = require('./network-protocol')
const networkTypes = require('./network-type')
const reportingProtocols = require('./reporting-protocol')
const users = require('./user')

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' })
})

routes.use('/applications', applications)
routes.use('/device-profiles', deviceProfiles)
routes.use('/devices', devices)
routes.use('/networks', networks)
routes.use('/network-protocols', networkProtocols)
routes.use('/network-types', networkTypes)
routes.use('/reporting-protocols', reportingProtocols)
routes.use('/users', users)

module.exports = routes
