class AxiosRestApi {
  constructor (opts) {
    const optionDefaults = {
      axios: null,
      authHeaders: {},
      urls: {},
      camelCaseDelimiter: '',
      cache: null
    }
    Object.assign(this, optionDefaults, opts)
  }

  _axiosOpts (name, template, params, { useSession = true, ...opts } = {}) {
    template = this.urls[name] || template
    const url = template.replace(/\/:([^/]+)/g, (_, key) => `/${params[key]}`)
    opts = { url, ...opts }
    if (useSession) opts.headers = Object.assign({}, this.authHeaders, opts.headers)
    return opts
  }

  _urlName (name) {
    if (!this.camelCaseDelimiter) return name
    return name.replace(/([a-z][A-Z])/g, g => `${g[0]}${this.camelCaseDelimiter}${g[1].toLowerCase()}`)
  }

  logout () {
    this.authHeaders = {}
  }

  async load (name, urlParams, opts) {
    const url = `/${this._urlName(name)}/:id`
    const result = await this.axios(this._axiosOpts(name, url, urlParams, opts))
    if (this.cache) await this.cache.load(name, result, urlParams, opts)
    return result
  }

  async list (name, urlParams, opts) {
    const url = `/${this._urlName(name)}`
    const result = await this.axios(this._axiosOpts(name, url, urlParams, opts))
    if (this.cache) await this.cache.list(name, result, urlParams, opts)
    return result
  }

  async create (name, urlParams, opts) {
    const url = `/${this._urlName(name)}`
    const result = await this.axios(this._axiosOpts(name, url, urlParams, { method: 'POST', ...opts }))
    if (this.cache) await this.cache.create(name, result, urlParams, opts)
    return result
  }

  async update (name, urlParams, opts) {
    const url = `/${this._urlName(name)}/:id`
    const result = await this.axios(this._axiosOpts(name, url, urlParams, { method: 'PATCH', ...opts }))
    if (this.cache) await this.cache.update(name, result, urlParams, opts)
    return result
  }

  async remove (name, urlParams, opts) {
    const url = `/${this._urlName(name)}/:id`
    const result = await this.axios(this._axiosOpts(name, url, urlParams, { method: 'DELETE', ...opts }))
    if (this.cache) await this.cache.remove(name, result, urlParams, opts)
    return result
  }
}

class AxiosRestApiCache {
  constructor (opts) {
    const optionDefaults = {
      cache: {},
      idKey: 'id',
      setCache: x => Object.assign(this.cache, x)
    }
    Object.assign(this, optionDefaults, opts)
  }

  _cacheWithoutItems (name, items) {
    const { idKey, cache } = this
    let resourceCache = cache[name] || []
    return resourceCache.filter(x => !items.some(y => y[idKey] === x[idKey]))
  }

  async _cacheUpsert (name, items) {
    items = items.filter(x => x)
    if (!items.length) return
    await this.setCache({ [name]: [
      ...this._cacheWithoutItems(name, items),
      ...items
    ] })
  }

  load (name, result) {
    return this._cacheUpsert(name, [result.data])
  }

  list (name, result) {
    return this._cacheUpsert(name, result.data)
  }

  create (name, result) {
    return this._cacheUpsert(name, [result.data])
  }

  update (name, result) {
    return this._cacheUpsert(name, [result.data])
  }

  remove (name, _, urlParams) {
    const id = urlParams[this.idKey] || urlParams.id
    return this.setCache({ [name]: this._cacheWithoutItems(name, [{ [this.idKey]: id }]) })
  }
}

module.exports = {
  AxiosRestApi,
  AxiosRestApiCache
}
