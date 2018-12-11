#!/usr/bin/env node
const { execSync } = require('child_process')
const { imageTags } = require('./lib/package')
const component = require('../component.json')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const opts = { cwd: ROOT, stdio: 'inherit' }

const gitTag = `v${component.version}`

// Push a version tag for docker
execSync(`docker pull ${imageTags.releaseCandidate}`, opts)
execSync(`docker tag ${imageTags.releaseCandidate} ${imageTags.version}`, opts)
execSync(`docker push ${imageTags.version}`, opts)

// Add a tag in git
execSync(`git tag -a ${gitTag} -m "Version ${component.version}"`, opts)
execSync(`git push origin ${gitTag}`, opts)