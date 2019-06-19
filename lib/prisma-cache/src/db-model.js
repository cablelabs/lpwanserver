const {
  onFail,
  lowerFirst,
  upperFirst,
  formatRelationshipsIn,
  formatInputData,
  mkError } = require('./utils')

module.exports = class DbModel {
  constructor ({ name, pluralName, fragments, defaultFragmentKey, prisma, log }) {
    this.lowerName = lowerFirst(name)
    this.upperName = upperFirst(name)
    this.lowerPluralName = lowerFirst(pluralName)
    this.upperPluralName = upperFirst(pluralName)
    this.fragments = fragments
    this.defaultFragmentKey = defaultFragmentKey
    this.prisma = prisma
    this.log = log || console.log.bind(console)
  }

  async load (uniqueKeyObj, opts = {}) {
    let { prisma, lowerName, fragments } = this
    let fragment = opts.fragment || this.defaultFragmentKey
    const rec = await onFail(400, () => prisma[lowerName](uniqueKeyObj).$fragment(fragments[fragment]))
    if (!rec) throw mkError(404, `${this.upperName} not found.`)
    return rec
  }

  async list ({ limit, offset, ...where } = {}, opts = {}) {
    let { prisma, lowerPluralName } = this
    let fragment = opts.fragment || this.defaultFragmentKey
    where = formatRelationshipsIn(where)
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    let promises = [
      prisma[lowerPluralName](query).$fragment(this.fragments[fragment])
    ]
    promises.push(opts.includeTotal
      ? prisma[`${lowerPluralName}Connection`]({ where }).aggregate().count()
      : Promise.resolve()
    )
    return Promise.all(promises)
  }

  async create (data, opts = {}) {
    let fragment = opts.fragment || this.defaultFragmentKey
    data = formatInputData(data)
    return this.prisma[`create${this.upperName}`](data).$fragment(this.fragments[fragment])
  }

  async update (uniqueKeyObj, data, opts = {}) {
    let fragment = opts.fragment || this.defaultFragmentKey
    data = formatInputData(data)
    return this.prisma[`update${this.upperName}`]({ data, where: uniqueKeyObj }).$fragment(this.fragments[fragment])
  }

  async remove (uniqueKeyObj) {
    return onFail(400, () => this.prisma[`delete${this.upperName}`](uniqueKeyObj))
  }
}
