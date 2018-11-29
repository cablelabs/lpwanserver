const express = require('express')
const bodyParser = require('body-parser')
const Loki = require('lokijs')
const jwt = require('jsonwebtoken')

// Server ID for discovery service
const SERVER_ID = 'ttn-account-server'

// Key pair for account server
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJWZiacVVLxfmyH/4L9unwJPDOCE6eet
VFEWdmzUVRWwRlBj/sI0s0Ew0mAx6Z/UPNEQ3ZiPnjQKZWfOKRLXBvkCAwEAAQ==
-----END PUBLIC KEY-----`
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBAJWZiacVVLxfmyH/4L9unwJPDOCE6eetVFEWdmzUVRWwRlBj/sI0
s0Ew0mAx6Z/UPNEQ3ZiPnjQKZWfOKRLXBvkCAwEAAQJAErHzT9wMkNXpzx/o+ENc
v68dTtmNWZSBmviRqBwI3gLNYrvMrGscXHJXYJkLYgwmefSNu3Yb5lLKWaB1aA7e
uQIhAPHnx/CHXgUXqANMsW+SuMoOpiCDnyBCRzLj8RnN5y5DAiEAnlDxGEm5VheS
ERAc4/r+DLsyDAnBEBdwB+3dNwNJiBMCIQCmJhFgtkkwbDgc1A9G19qOBZO630xr
JrqqTH8rvw2a6wIgWtJ6jYF11qLtA+bnfA54ghs+CdPqsu2PMq1N1AqJu4sCIHFz
S6dKVEkiWGaV8fv+LxHtG8dwoUjg03fNgWBCgelg
-----END RSA PRIVATE KEY-----`

// Express app
const app = express()
app.use(bodyParser.json())

// Loki.js db
const db = new Loki(`${SERVER_ID}.db`)

// All db collections are read from data/seed.json
const collections = Object.keys(require('./data/seed.json'))
  .reduce(acc, collectionName => {
    acc[collectionName] = db.addCollection(collectionName)
    acc[collectionName].insert(seed[collectionName])
    return acc
  })

// *****************************************
// Helpers
// *****************************************
function getJwt (payload) {
  return jwt.sign(payload, PRIVATE_KEY, {
    issuer:  SERVER_ID,
    expiresIn:  "12h",
    algorithm:  "RS256"
   });
}

function getTokenPayloadApps (scope) {
  return scope.reduce((acc, x) => {
    if (x.indexOf('apps:') < 0) return acc
    const name = x.replace('apps:', '')
    acc[name] = ['settings', 'devices']
  }, {})
}

function lokiCrud (app, name) {
  app.get(`/${name}`, (req, res) => {
    res.json(collections[name].find({}))
  })
  
  app.post(`/${name}`, (req, res) => {
    res.json(collections[name].insert(req.body))
  })
  
  app.get(`/${name}/:id`, (req, res) => {
    res.json(collections[name].findOne({ id: req.params.id }))
  })
  
  app.patch(`/${name}/:id`, (req, res) => {
    const doc = collections[name].findOne({ id: req.params.id })
    Object.assign(doc, req.body, { id: req.params.id })
    collections[name].update(doc)
    res.json(doc)
  })
  
  app.delete(`/${name}/:id`, (req, res) => {
    const doc = collections[name].findOne({ id: req.params.id })
    if (!doc) return res.status(404).send('Not Found')
    collections[name].remove(doc)
    return res.status(200).send('OK')
  })
}

// *****************************************
// Routes
// *****************************************
// used by MQTT to get rights for access key
app.get('/api/v2/applications/:appId/rights', (req, res) => {
  // authorization header is "Key {app_access_key}"
  var app = collections.applications.findOne({ id: req.params.appId })
  // If the app id or access key is invalid, it should return 401
  if (!app) {
    return res.status(401).send('Unauthorized')
  }
  // for this implementation, if appId is valid, going to always return all rights
  return res.json([
    "messages:up:r",
    "messages:down:w"
  ])
})

// used by handler to fetch public key
// public key used to validate signature on JWT token
app.get('/key', (req, res) => {
  res.json({
    "algorithm": "RS256",
    "key": PUBLIC_KEY
  })
})

app.post('/users/token', (req, res) => {
  const access_token = getJwt({
    "type": "user",
    "scope": req.body.scope,
    "apps": getTokenPayloadApps(req.body.scope)
  })
  return res.json({ access_token })
})

app.get('/users/authorize', (req, res) => {
  res.redirect(`${req.query.redirect_uri}?code=123`)
})

// applications CRUD
lokiCrud(app, 'applications')