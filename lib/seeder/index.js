const R = require('ramda')

const omitId = R.omit(['id'])

function createTypeRecord (types, typeIndex, itemIndex) {
  // replace relationship IDs in record
  let data = types[typeIndex].items[itemIndex]
  let rels = Object.keys(data).filter(key => {
    return typeof data[key] === 'object' && '$type' in data[key]
  })
  data = rels.reduce((acc, key) => {
    const { $type, $id } = acc[key]
    const type = types.find(x => x.id === $type)
    if (!type) {
      throw new Error(`Unknown type ${$type}`)
    }
    if (!type.records || type.records.length !== type.items.length) {
      throw new Error(`Invalid records collection for type ${type.id}`)
    }
    const itemIndex = type.items.findIndex(x => x.id === $id)
    if (itemIndex < 0) {
      throw new Error(`Item of type ${type.id} with ID ${$id} not found.`)
    }
    acc[key] = type.records[itemIndex].id
    return acc
  }, data)
  return types[typeIndex].create(omitId(data))
}

async function createType (types, typeIndex) {
  let type = types[typeIndex]
  let records = []
  for (let i = 0; i < type.items.length; i++) {
    records[i] = await createTypeRecord(types, typeIndex, i)
  }
  return records
}

async function seedData (types) {
  for (let i = 0; i < types.length; i++) {
    types[i].records = await createType(types, i)
  }
  return types.reduce((acc, x) => {
    acc[x.id] = x.records
    return acc
  }, {})
}

module.exports = {
  seedData
}
