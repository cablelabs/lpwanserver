// const httpError = require('http-errors')
const { list, load, update: _update, remove, updateByQuery: _updateByQuery, loadByQuery } = require('../model-lib')

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
  const networkDeployment = ctx.db.create({ ...opts, data })
  setImmediate(() => ctx.$self.syncNetworkDeployment({ networkDeployment }))
  return networkDeployment
}

async function update (ctx, { data, ...args }) {
  if (data.status === 'SYNCED') {
    data = { ...data, syncFailed: false, logs: [] }
  }
  const networkDeployment = await _update(ctx, { ...args, data })
  setImmediate(() => ctx.$self.syncNetworkDeployment({ networkDeployment }))
  return networkDeployment
}

async function updateByQuery (ctx, args) {
  const networkDeployment = await _updateByQuery(ctx, args)
  setImmediate(() => ctx.$self.syncNetworkDeployment({ networkDeployment }))
  return networkDeployment
}

async function syncNetworkDeployment (ctx, { networkDeployment }) {
  if (networkDeployment.status === 'SYNCED') return
  let meta
  try {
    const network = await ctx.$m.network.load({ where: networkDeployment.network })
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
    await ctx.$self.update({
      where: { id: networkDeployment.id },
      data: {
        syncFailed: true,
        logs: [...networkDeployment.logs, err.toString()]
      }
    })
    return
  }
  if (networkDeployment.status === 'REMOVED') {
    await ctx.$self.remove({
      where: { id: networkDeployment.id }
    })
  }
  else {
    await ctx.$self.update({
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
    load,
    loadByQuery,
    update,
    updateByQuery,
    remove
  },
  privateApi: {
    syncNetworkDeployment
  },
  fragments
}
