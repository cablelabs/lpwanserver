const { create, list, load, update, remove } = require('./Model')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkType on NetworkType {
    id
    name
    version
  }`
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  api: {
    create,
    list,
    load,
    update,
    remove
  },
  fragments
}
