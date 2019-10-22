// const httpError = require('http-errors')
const { list, load, update: _update, remove, updateByQuery: _updateByQuery, loadByQuery } = require('../model-lib')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkDeployment on NetworkDeployment {
    id
    status
    type
    networkSettings
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
  data = { meta: {}, logs: [], ...data }
  const rec = ctx.db.create({ ...opts, data })
  ctx.emitter.emit('networkDeployment:updated', rec)
  return rec
}

async function update (ctx, { data, ...args }) {
  if (data.status === 'SYNCED') {
    data = { ...data, logs: [] }
  }
  const rec = await _update(ctx, { ...args, data })
  ctx.emitter.emit('networkDeployment:updated', rec)
  return rec
}

async function updateByQuery (ctx, args) {
  const rec = await _updateByQuery(ctx, args)
  ctx.emitter.emit('networkDeployment:updated', rec)
  return rec
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
  fragments
}
