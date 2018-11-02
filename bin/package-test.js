const path = require('path')
const component =require('../component-test.json')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const opts = { cwd: ROOT, stdio: 'inherit' }

const image = `${component.registry}/${component.name}:${component.version}-${component.build}-rc`
const latestImage = `${component.registry}/${component.name}:latest`

async function package () {
  execSync('rm -rf ./data/demo_data', opts)
  execSync('cp -r ./data/demo_baseline ./data/demo_data', opts)
  execSync(`docker build -f docker/Dockerfile.test -t ${image} -t ${latestImage} .`, opts)
  console.info('The container was successfully built.')
}

package().catch(console.error)
