const path = require('path')
const { execSync } = require('child_process')
const component = require('../../component.json')

const { registry, name, version } = component
let { RC_TAG } = process.env

if (!RC_TAG) {
  const buildNumber = process.env.TRAVIS_BUILD_NUMBER || component.build
  RC_TAG = `${version}-${buildNumber}-rc`
}

const imageTags = {
  releaseCandidate: `${registry}/${name}:${RC_TAG}`,
  latest: `${registry}/${name}:latest`,
  version: `${registry}/${name}:${version}`
}

const ROOT = path.join(__dirname, '../..')
const opts = { cwd: ROOT, stdio: 'inherit' }

function packageRestServer () {
  execSync(`docker build -f docker/Dockerfile -t ${imageTags.releaseCandidate} -t ${imageTags.latest} .`, opts)
}

module.exports = {
  imageTags,
  packageRestServer
}
