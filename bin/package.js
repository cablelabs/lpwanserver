const path = require('path')
const component =require('../component.json')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const opts = { cwd: ROOT, stdio: 'inherit' }

const buildNumber = process.env.TRAVIS_BUILD_NUMBER || component.build

const image = `${component.registry}/${component.name}:${component.version}-${buildNumber}-rc`
const latestImage = `${component.registry}/${component.name}:latest`

async function package () {
  execSync('rm -rf ./data/demo_data', opts)
  execSync('cp -r ./data/demo_baseline ./data/demo_data', opts)
  execSync(`docker build -f docker/Dockerfile -t ${image} -t ${latestImage} .`, opts)
  console.info('The container was successfully built.')
}

package().catch(console.error)
