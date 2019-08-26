const config = require('../config')
const redis = require('redis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis)

module.exports = {
  keyval: redis.createClient({ url: config.redis_url }),
  pub: redis.createClient({ url: config.redis_url }),
  sub: redis.createClient({ url: config.redis_url })
}
