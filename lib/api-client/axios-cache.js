class AxiosCache {
  constructor (opts) {
    Object.assign(this, { cache: {}, idKey: 'id' }, opts)
  }

  async _cacheWithoutItems (name, items) {
    const { idKey, cache } = this
    let resourceCache = cache[name] || []
    return resourceCache.filter(x => !items.some(y => y[idKey] === x[idKey]))
  }

  async _cacheUpsert (name, items) {
    if (typeof this.setCache !== 'function') return
    items = items.filter(x => x)
    if (!items.length) return
    await this.setCache({ [name]: [
      ...this._cacheWithoutItems(name, items),
      ...items
    ] })
  }

  async load (name, _, result) {
    await this._cacheUpsert(name, [result])
  }

  async list (name, _, result) {
    const list = this.itemsProp ? result[this.itemsProp] : result
    await this._cacheUpsert(name, list)
  }

  async create (name, _, result) {
    await this._cacheUpsert(name, [result])
  }

  async update (name, id, ...args) {
    const result = await this.connector.update(name, ...args)
    await this._cacheUpsert(name, [result])
  }

  async remove (name, args) {
    if (typeof this.setCache !== 'function') return
    const [ params ] = args
    const id = params[this.idKey] || params.id
    await this.setCache({ [name]: this._cacheWithoutItems(name, [{ [this.idKey]: id }]) })
  }
}

module.exports = {
  AxiosCache
}
