const config = require('../config')
const redis = require('redis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis)

module.exports = {
  redisClient: redis.createClient({ url: config.get('redis_url') }),
  redisPub: redis.createClient({ url: config.get('redis_url') }),
  redisSub: redis.createClient({ url: config.get('redis_url') })
}
