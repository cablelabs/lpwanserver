const path = require('path')
const Express = require('express')

module.exports = function serveSpa ({ app, omit, public: publicDir }) {
  if (!omit) omit = () => false
  app
    .use(Express.static(publicDir))
    .get('*', (req, res, next) => {
      if (req.accepts('html') && !omit(req)) {
        return res.sendFile(path.join(publicDir, 'index.html'))
      }
      return next()
    })
}
