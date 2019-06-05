const { HttpLink } = require('apollo-link-http')
const { introspectSchema } = require('graphql-tools')
const fs = require('fs')
const nodeFetch = require('node-fetch')
const path = require('path')

// Server fetches introspection query from prisma on startup
// This fn caches the response so it can be read from a file
// insead of http request for faster startup
module.exports = async function cacheIntrospectionQuery (dirPath, uri) {
  const fetch = async (...args) => {
    const text = await nodeFetch(...args).then(x => x.text())
    const writePath = path.join(dirPath, 'introspected-schema.json')
    fs.writeFileSync(writePath, text)
    return { text: () => Promise.resolve(text) }
  }
  return introspectSchema(new HttpLink({ uri, fetch }))
}
