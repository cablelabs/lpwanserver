class AxiosConnector {
  constructor (opts) {
    this.axios = opts.axios
    this.authHeaders = {}
    this.urls = opts.urls
  }

  _buildOpts (name, template, params, opts) {
    template = this.urls[name] || template
    const url = template.replace(/\/:([^/]+)/g, (_, key) => `/${params[key]}`)
    return {
      url,
      ...opts,
      headers: Object.assign({}, this.authHeaders, opts.headers)
    }
  }

  logout () {
    this.authHeaders = {}
  }

  load (name, urlParams, opts) {
    return this.axios(this._buildOpts(name, `/${name}/:id`, urlParams, opts))
  }

  list (name, urlParams, opts) {
    return this.axios(this._buildOpts(name, `/${name}`, urlParams, opts))
  }

  create (name, urlParams, opts) {
    return this.axios(this._buildOpts(name, `/${name}`, urlParams, { ...opts, method: 'POST' }))
  }

  update (name, urlParams, opts) {
    return this.axios(this._buildOpts(name, `/${name}/:id`, urlParams, { ...opts, method: 'PUT' }))
  }

  remove (name, urlParams, opts) {
    return this.axios(this._buildOpts(name, `/${name}/:id`, urlParams, { ...opts, method: 'DELETE' }))
  }
}

module.exports = {
  AxiosConnector
}
