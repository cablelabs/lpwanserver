// const httpError = require('http-errors')
const { list, load, update: _update, updateByQuery: _updateByQuery, loadByQuery, listAll, removeMany } = require('../model-lib')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkDeployment on NetworkDeployment {
    id
    status
    syncFailed
    type
    meta
    logs
    network {
      id
    }
    application {
      id
    }
    device {
      id
    }
    deviceProfile {
      id
    }
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function create (ctx, { data, ...opts }) {
  data = { meta: {}, logs: [], syncFailed: false, ...data }
  const networkDeployment = await ctx.db.create({ ...opts, data })
  await ctx.$self.syncNetworkDeployment({ networkDeployment })
  return networkDeployment
}

async function update (ctx, { data, ...args }) {
  if (data.status === 'SYNCED') {
    data = { ...data, syncFailed: false, logs: [] }
  }
  const networkDeployment = await _update(ctx, { ...args, data })
  await ctx.$self.syncNetworkDeployment({ networkDeployment })
  return networkDeployment
}

async function updateByQuery (ctx, args) {
  const networkDeployment = await _updateByQuery(ctx, args)
  await ctx.$self.syncNetworkDeployment({ networkDeployment })
  return networkDeployment
}

async function remove (ctx, { id }) {
  const rec = await ctx.db.update({ where: { id }, data: { status: 'REMOVED' } })
  await ctx.$self.syncNetworkDeployment({ networkDeployment: rec })
}

async function syncNetworkDeployment (ctx, { networkDeployment }) {
  if (networkDeployment.status === 'SYNCED') return
  let meta
  try {
    let network = await ctx.$m.network.load({ where: networkDeployment.network, decryptSecurityData: true })
    if (!network.meta.authorized) {
      if (!network.securityData && networkDeployment.status === 'REMOVED' && !networkDeployment.meta.remoteId) {
        await ctx.db.remove(networkDeployment.id)
        return
      }
      if (network.securityData) {
        network = await ctx.$m.network.connect({ network })
      }
      if (!network.meta.authorized) {
        throw new Error('Network is not authorized')
      }
    }
    switch (networkDeployment.type) {
      case 'APPLICATION':
        meta = await ctx.$m.networkProtocol.syncApplication({ network, networkDeployment })
        break
      case 'DEVICE':
        meta = await ctx.$m.networkProtocol.syncDevice({ network, networkDeployment })
        break
      case 'DEVICE_PROFILE':
        meta = await ctx.$m.networkProtocol.syncDeviceProfile({ network, networkDeployment })
        break
    }
  }
  catch (err) {
    await ctx.db.update({
      where: { id: networkDeployment.id },
      data: {
        syncFailed: true,
        logs: [...(networkDeployment.logs || []), err.toString()]
      }
    })
    return
  }
  if (networkDeployment.status === 'REMOVED') {
    await ctx.db.remove(networkDeployment.id)
  }
  else {
    await ctx.db.update({
      where: { id: networkDeployment.id },
      data: { status: 'SYNCED', meta }
    })
  }
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'networkDeployment',
  publicApi: {
    create,
    list,
    listAll,
    load,
    loadByQuery,
    update,
    updateByQuery,
    remove,
    removeMany
  },
  privateApi: {
    syncNetworkDeployment
  },
  fragments
}
