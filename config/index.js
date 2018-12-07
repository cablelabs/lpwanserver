const nconf = require('nconf')
const hjson = require('hjson')

// Values higher up override values beneath
nconf
  // command line
  .argv() 
  // environment variables
  .env()
  // Selectively override defaults with {NODE_ENV}.hjson file
  .file('node_env_file', { file: `config/${nconf.get('NODE_ENV')}.hjson`, format: hjson })
  // Load defaults
  .file('defaults', { file: 'config/defaults.hjson', format: hjson })
  