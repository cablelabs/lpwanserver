const path = require('path')
const Express = require('express')
const fs = require('fs')

function serveSpa ({ app, omit, publicDir }) {
  if (!omit) omit = () => false

  if (!publicDir) {
    throw new Error('"publicDir" option required for serveSpa middleware')
  }

  const indexFilePath = path.join(publicDir, 'index.html')

  // ensure server has access to index.html
  try {
    fs.accessSync(indexFilePath)
  }
  catch (err) {
    throw new Error(`No access to "${indexFilePath}": ${err}`)
  }

  // add middleware to express
  app
    .use(Express.static(publicDir))
    .get('*', (req, res, next) => {
      if (req.accepts('html') && !omit(req)) {
        return res.sendFile(indexFilePath)
      }
      return next()
    })
}

function configureCors (whitelist) {
  whitelist = whitelist.map(x => new RegExp(x))
  return {
    origin (origin, callback) {
      if (whitelist.some(x => x.test(origin))) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS settings'))
    }
  }
}

module.exports = {
  serveSpa,
  configureCors
}
