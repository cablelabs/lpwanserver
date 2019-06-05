const Loriot = require('../Loriot')
const appLogger = require('../../../../lib/appLogger')
const ApiClient = require('./client')

module.exports = class LoriotV4 extends Loriot {
  constructor (opts) {
    super(opts)
    this.client = new ApiClient()
  }
}
