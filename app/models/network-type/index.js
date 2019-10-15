const { create, list, load, update, remove } = require('../model-lib')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkType on NetworkType {
    id
    name
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function forAllNetworks (ctx, { networkTypeId, op }) {
  let [networks] = await ctx.$m.network.list({ where: { networkTypeId } })
  const mapFn = network => op(network)
    .then(result => ({ result }))
    .catch(e => ({ error: e.toString() }))
  return Promise.all(networks.map(mapFn))
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'networkType',
  publicApi: {
    create,
    list,
    load,
    update,
    remove,
    forAllNetworks
  },
  fragments
}
