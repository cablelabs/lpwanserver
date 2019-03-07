const { HttpLink } = require('apollo-link-http')
const { introspectSchema } = require('graphql-tools')
const fs = require('fs')
const nodeFetch = require('node-fetch')

// Server fetches introspection query from prisma on startup
// This fn caches the response so it can be read from a file
// insead of http request for faster startup
async function main () {
  const fetch = async (...args) => {
    const text = await nodeFetch(...args).then(x => x.text())
    fs.writeFileSync('../introspected-schema.json', text)
    return { text: () => Promise.resolve(text) }
  }

  return introspectSchema(new HttpLink({
    uri: 'http://localhost:4466',
    fetch
  }))
}

main()
