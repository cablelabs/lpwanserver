const { prisma } = require('./generated/prisma-client')

async function main () {
  const cos = await prisma.companies()
  console.log(JSON.stringify(cos))
}

main().catch(e => console.error(e))
