const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class NetworkType {
  constructor () {
    // Maps a type name to a numeric value.
    this.types = {}
    // Maps a numeric value to the type name.
    this.reverseTypes = {}
    // Cache of the raw type list, loaded at startup, and updated along with the
    // database.
    this.typeList = []

    this.reloadCache()
  }

  async reloadCache () {
    // Clear existing maps.  TypeList array cache is replaced at retrieval.
    this.types = {}
    this.reverseTypes = {}

    try {
      // Load the types from the database.
      this.typeList = await prisma.networkTypes()
      this.typeList.forEach(x => {
        this.types[x.name] = x.id
        this.reverseTypes[x.id] = x.name
      })
    }
    catch (err) {
      throw new Error('Failed to load network types: ' + err)
    }
  }

  async create (name) {
    const rec = await prisma.createNetworkType({ name })
    await this.reloadCache()
    return rec
  }

  async update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkType ID')
    const rec = await prisma.updateNetworkType({ data, where: { id } })
    await this.reloadCache()
    return rec
  }

  async remove (id) {
    await onFail(400, () => prisma.deleteNetworkType({ id }))
    await this.reloadCache()
  }

  async list () {
    // return prisma.networkTypes()
    return this.typeList
  }

  async load (id) {
    // const rec = await onFail(400, () => prisma.networkType({ id }))
    const rec = this.typeList.find(x => x.id === id)
    if (!rec) throw httpError(404, 'NetworkType not found')
    return rec
  }
}
