const path = require('path')
const { create, list, load, update, remove } = require('../model-lib')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicReportingProtocol on ReportingProtocol {
    id
    name
    protocolHandler
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function initialize (ctx) {
  const [ records ] = await ctx.db.list()
  const handlersDir = path.join(__dirname, '../../reportingProtocols')
  records.forEach(x => {
    let Handler = require(path.join(handlersDir, x.protocolHandler))
    ctx.handlers[x.id] = new Handler({ reportingProtocolId: x.id })
  })
}

function getHandler (ctx, { id }) {
  return ctx.handlers[id]
}

async function report (ctx, { application, data }) {
  const handler = ctx.$self.getHandler(application.reportingProtocol)
  await handler.report({ application, data })
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'reportingProtocol',
  context: {
    handlers: {}
  },
  publicApi: {
    initialize,
    create,
    list,
    load,
    update,
    remove,
    getHandler,
    report
  },
  fragments
}
