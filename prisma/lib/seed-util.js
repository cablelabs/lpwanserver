const REL_PROPS = ['type', 'plural']

const lowerFirst = x => `${x[0].toLowerCase()}${x.slice(1)}`

const connectId = seed => idPlaceholder => {
  const index = seed.bodyList.findIndex(x => x.id === idPlaceholder)
  console.log(JSON.stringify(seed.records[index]))
  return { id: seed.records[index].id }
}

const connectBody = (seeds, propMap = {}) => ({ id, ...body }) => {
  return Object.keys(body).reduce((acc, prop) => {
    const mappedProp = propMap[prop] || prop
    const relationship = seeds.find(
      seed => REL_PROPS.some(x => lowerFirst(seed[x]) === lowerFirst(mappedProp))
    )
    if (relationship) {
      const connect = connectId(relationship)
      if (Array.isArray(acc[prop])) {
        acc[prop] = { connect: acc[prop].map(connect) }
      } else {
        acc[prop] = { connect: connect(acc[prop]) }
      }
    }
    return acc
  }, body)
}

async function createRecordsOfType (type, seeds, prisma) {
  const seed = seeds.find(x => x.type === type)
  let bodyList = seed.bodyList.map(connectBody(seeds, seed.propMap))
  const create = prisma[`create${type}`].bind(prisma)
  seed.records = await Promise.all(bodyList.map(create))
  console.log(`Created ${seed.plural}:`, JSON.stringify(seed.records))
}

module.exports = async function createRecords (seeds, prisma) {
  const types = seeds.map(x => x.type)
  for (let i = 0; i < types.length; i++) {
    await createRecordsOfType(types[i], seeds, prisma)
  }
}
