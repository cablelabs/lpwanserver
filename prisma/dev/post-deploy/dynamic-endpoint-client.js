const fs = require('fs')
const path = require('path')

// Build prisma endpoint from environment variables
async function main () {
  const readPath = path.join(__dirname, '../generated/prisma-client/index.js')
  const writePath = path.join(__dirname, '../generated/prisma-client/index-dynamic-endpoint.js')
  const client = fs.readFileSync(readPath, { encoding: 'utf8' })
  const dynamicClient = client.replace(
    /http:\/\/localhost:4466/,
    '${process.env.prisma_protocol}://${process.env.prisma_host}:${process.env.prisma_port}'
  )
  fs.writeFileSync(writePath, dynamicClient)
}

main()
