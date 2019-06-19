const { redisClient, redisPub, redisSub } = require('../../rest/lib/redis')

after(() => Promise.all([
  redisClient.quit(),
  redisPub.quit(),
  redisSub.quit()
]))
