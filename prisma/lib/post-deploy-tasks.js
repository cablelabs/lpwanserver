const cacheIntrospectionQuery = require('./cache-instropection-query')
const path = require('path')

const { env } = process

const prismaUrl = `${env.prisma_protocol}://${env.prisma_host}:${env.prisma_port}`

Promise.all([
  cacheIntrospectionQuery(path.join(__dirname, '../generated'), prismaUrl)
])
.catch(e => console.error(e))
