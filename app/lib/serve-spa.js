const path = require('path')
const Express = require('express')
const fs = require('fs')

module.exports = function serveSpa ({ app, omit, public: publicDir }) {
  if (!omit) omit = () => false
  const indexFilePath = path.join(publicDir, 'index.html')

  // ensure server has access to index.html
  fs.accessSync(indexFilePath)

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
