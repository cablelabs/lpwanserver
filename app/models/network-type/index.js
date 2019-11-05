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
  let [networks] = await ctx.$m.network.list({ where: { networkTypeId }, decryptSecurityData: true })
  if (!networks.length) {
    // possible that it's an IP NetworkType, for which there are no networks
    // In that case, spoof a network
    let nwkType = await ctx.$m.networkType.load({ where: { id: networkTypeId } })
    if (nwkType.name === 'IP') {
      let ipNwkProto = await ctx.$m.networkProtocol.loadByQuery({ where: { name: 'IP' } })
      networks = [{ networkProtocol: { id: ipNwkProto.id } }]
    }
  }
  const mapFn = network => {
    const result = op(network)
    if (result && typeof result === 'object' && typeof result.catch === 'function') {
      return result.then(
        result => ({ result }),
        err => ({ error: err.toString() })
      )
    }
    return { result }
  }
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
