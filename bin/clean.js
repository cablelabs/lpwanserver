const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const component =require('../component.json')

const rcImage = `${component.registry}/${component.name}:${component.version}-${component.build}-rc`
const latestImage = `${component.registry}/${component.name}:latest`

async function clean () {
  console.info(`Forcefully removing rc image [${rcImage}]`)
  await exec(`docker rmi ${rcImage} --force`)
  console.info(`Forcefully removing latest image [${latestImage}]`)
  await exec(`docker rmi ${latestImage} --force`)
}

clean().catch(console.error)