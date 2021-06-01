#!/usr/bin/env node

const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const { imageTags } = require('./lib/package')

async function main () {
  await removeContainersAndVolumes()
  await removeDockerImages()
}

main().catch(e => console.error(e))

async function removeContainersAndVolumes () {
  const containers = [
    'lpwanserver_dev_unit_test',
    'lpwanserver_dev_api_test',
    'lpwanserver_dev_e2e_test',
    'lpwanserver_dev_prisma',
    'lpwanserver_dev_postgres',
    'lpwanserver_dev_redis',
    'lpwanserver_dev_chirp_postgres',
    'lpwanserver_dev_chirp_redis',
    'lpwanserver_dev_chirpnwksvr',
    'lpwanserver_dev_chirpnwksvr1',
    'lpwanserver_dev_chirpappsvr',
    'lpwanserver_dev_chirpappsvr1',
    'lpwanserver_dev_chirp_mosquitto'
  ]

  const volumes = [
    'lpwanserver_dev_postgres',
    'lpwanserver_dev_redis',
    'lpwanserver_dev_chirp_postgresqldata',
    'lpwanserver_dev_chirp_redisdata',
    'chirpstack_lpwanserver_dev_chirp_postgresqldata',
    'chirpstack_lpwanserver_dev_chirp_redisdata'
  ]

  const logErr = () => {
    // console.log(e.message)
  }

  await Promise.all([
    exec(`docker container rm ${containers.join(' ')} --force`).catch(logErr),
    exec(`docker volume rm ${volumes.join(' ')} --force`).catch(logErr)
  ])
}

function removeDockerImages () {
  const tags = Object.keys(imageTags).reduce((acc, x) => {
    acc.push(imageTags[x])
    return acc
  }, [])
  return exec(`docker rmi ${tags.join(' ')} --force`)
}
