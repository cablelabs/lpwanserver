const routes = require('express').Router()
const applications = require('./application')

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' })
})

routes.use('/applications', applications)

module.exports = routes
