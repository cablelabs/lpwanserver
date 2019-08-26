const R = require('ramda')
const httpError = require('http-errors')
const {
  onFail,
  lowerFirst,
  upperFirst,
  formatRelationshipsIn,
  formatInputData } = require('./utils')

module.exports = class DbModel {
  constructor ({ name, pluralName, fragments, defaultFragmentKey, prisma }) {
    this.lowerName = lowerFirst(name)
    this.upperName = upperFirst(name)
    this.lowerPluralName = lowerFirst(pluralName)
    this.upperPluralName = upperFirst(pluralName)
    this.fragments = fragments
    this.defaultFragmentKey = defaultFragmentKey
    this.prisma = prisma
  }

  async load ({ where, ...opts }) {
    if (!where) throw httpError(400, 'Missing record identifier "where"')
    let { prisma, lowerName, fragments } = this
    let fragment = opts.fragment || this.defaultFragmentKey
    const rec = await onFail(400, () => prisma[lowerName](where).$fragment(fragments[fragment]))
    if (!rec) throw httpError(404, `${this.upperName} not found.`)
    return rec
  }

  async list ({ limit, offset, where = {}, ...opts } = {}) {
    if (!where) throw httpError(400, 'Missing record selector "where"')
    let { prisma, lowerPluralName } = this
    let fragment = opts.fragment || this.defaultFragmentKey
    where = formatRelationshipsIn(where)
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    let promises = [
      prisma[lowerPluralName](query).$fragment(this.fragments[fragment])
    ]
    if (opts.includeTotal) {
      promises.push(prisma[`${lowerPluralName}Connection`]({ where }).aggregate().count())
    }
    return Promise.all(promises)
  }

  async create ({ data, ...opts }) {
    let fragment = opts.fragment || this.defaultFragmentKey
    data = formatInputData(data)
    return this.prisma[`create${this.upperName}`](data).$fragment(this.fragments[fragment])
  }

  async update ({ where, data, ...opts }) {
    if (!where) throw httpError(400, 'Missing record identifier "where"')
    let fragment = opts.fragment || this.defaultFragmentKey
    data = formatInputData(data)
    return this.prisma[`update${this.upperName}`]({ where, data }).$fragment(this.fragments[fragment])
  }

  async remove (id) {
    if (!id) throw httpError(400, 'Missing record identifier')
    return onFail(400, () => this.prisma[`delete${this.upperName}`]({ id }))
  }

  async resolveId (where) {
    return where.id || R.pick(['id'], await this.load({ where }))
  }
}
