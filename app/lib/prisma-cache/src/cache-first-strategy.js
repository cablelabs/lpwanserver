const ObjectHash = require('object-hash')
const DbModel = require('./db-model')
const { mkError } = require('./utils')

module.exports = class CacheFirstStrategy extends DbModel {
  constructor (opts) {
    super(opts)
    this.redis = opts.redis
  }

  key (...args) {
    return `${this.lowerName}:${args.join(':')}`
  }

  async cacheRecord (record, args) {
    try {
      let hash = ObjectHash.sha1(args)
      await this.redis.saddAsync(this.key('loadIndex', record.id), hash)
      await this.redis.setAsync(this.key('load', hash), JSON.stringify(record))
    }
    catch (err) {
      this.log(`Failed to cache ${this.name} record: ${err}`)
      this.log(JSON.stringify({ record, args }))
    }
  }

  async removeFromCache (uniqueKeyObj) {
    let scanAsync = async (id, start) => {
      const result = await this.redis.sscanAsync(this.key('loadIndex', id), start)
      return [ parseInt(result[0], 10), ...result.slice(1) ]
    }
    try {
      const { id } = await this.resolveId(uniqueKeyObj)
      let scan = await scanAsync(id, 0)
      let hashes = scan[1]
      while (scan[0]) {
        scan = await scanAsync(id, scan[0])
        hashes = [ ...hashes, ...scan[1] ]
      }
      let keys = hashes.map(hash => this.key('load', hash))
      await Promise.all([
        this.redis.del(this.key('loadIndex', id)),
        ...keys.map(x => this.redis.del(x))
      ])
    }
    catch (err) {
      this.log(`Unable to remove ${this.lowerName} cache for: ${JSON.stringify(uniqueKeyObj)}`)
      throw mkError(500, err)
    }
  }

  async resolveId (uniqueKeyObj) {
    if (uniqueKeyObj.id) return uniqueKeyObj
    return super.load(uniqueKeyObj)
  }

  async load (...args) {
    const hash = ObjectHash.sha1(args)
    let record = await this.redis.getAsync(this.key('load', hash))
    if (record) return JSON.parse(record)
    record = await super.load(...args)
    await this.cacheRecord(record, args)
    return record
  }

  async update (uniqueKeyObj, data, opts = {}) {
    await this.removeFromCache(uniqueKeyObj)
    return super.update(uniqueKeyObj, data, opts)
  }

  async remove (uniqueKeyObj) {
    await this.removeFromCache(uniqueKeyObj)
    return super.remove(uniqueKeyObj)
  }

  async clearModelFromCache () {
    let scan = await this.redis.scanAsync(0)
    let regex = new RegExp(`^${this.lowerName}`)
    while (parseInt(scan[0], 10)) {
      let keys = scan[1].filter(x => regex.test(x))
      await Promise.all(keys.map(x => this.redis.del(x)))
      scan = await this.redis.scanAsync(scan[0])
    }
  }
}
