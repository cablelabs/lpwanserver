const { redisClient, redisPub, redisSub } = require('../../app/lib/redis')

console.log(process.env.prisma_url)

after(() => Promise.all([
  redisClient.quit(),
  redisPub.quit(),
  redisSub.quit()
]))
