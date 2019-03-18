const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const { imageTags } = require('./lib/package')

async function main () {
  // remove docker images
  const tags = Object.keys(imageTags.reduce((acc, x) => {
    acc.push(imageTags[x])
    return acc
  }, []))
  await exec(`docker rmi ${tags.join(' ')} --force`)

  // remove node_modules
  await exec('rm -rf node_modules')
}

main().catch(e => console.error(e))
