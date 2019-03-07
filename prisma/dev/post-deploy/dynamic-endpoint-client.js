const fs = require('fs')
const path = require('path')

// Build prisma endpoint from environment variables
async function main () {
  const readPath = path.join(__dirname, '../generated/prisma-client/index.js')
  const writePath = path.join(__dirname, '../generated/prisma-client/index-dynamic-endpoint.js')
  const client = fs.readFileSync(readPath, { encoding: 'utf8' })
  const dynamicClient = client.replace(
    /http:\/\/localhost:4466/,
    '${process.env.PRISMA_PROTOCOL}://${process.env.PRISMA_HOST}:${process.env.PRISMA_PORT}'
  )
  fs.writeFileSync(writePath, dynamicClient)
}

main()
