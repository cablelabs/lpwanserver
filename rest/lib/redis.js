const config = require('../config')
const redis = require('redis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis)
const client = redis.createClient({ url: config.get('redis_url') })

module.exports = {
  redisClient: client
}
