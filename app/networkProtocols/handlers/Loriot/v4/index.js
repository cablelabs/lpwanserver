const Loriot = require('../Loriot')
const ApiClient = require('./client')

module.exports = class LoriotV4 extends Loriot {
  constructor (opts) {
    super(opts)
    this.client = new ApiClient({ logger: opts.logger })
  }
}
