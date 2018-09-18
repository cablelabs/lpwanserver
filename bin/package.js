const path = require('path')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const component =require('../component.json')

const atPath = (...args) => path.join(__dirname, ...args)

const image = `${component.registry}/${component.name}:${component.version}-${component.build}-rc`
const latestImage = `${component.registry}/${component.name}:latest`

const cwd = atPath('..')

async function package () {
  await exec(`docker build -f docker/Dockerfile -t ${image} -t ${latestImage} .`, { cwd })
  console.info('The container was successfully built.')
}

package().catch(console.error)