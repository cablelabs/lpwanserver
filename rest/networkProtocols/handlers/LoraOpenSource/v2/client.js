const LoraOpenSourceRestClient = require('../client')
const R = require('ramda')

module.exports = class LoraOpenSourceV1RestClient extends LoraOpenSourceRestClient {
  createOrganization (network, session, body) {
    return super.createOrganization(network, session, { organization: body })
  }
  replaceOrganization (network, session, body) {
    return super.replaceOrganization(network, session, { organization: body })
  }
  async createUser (network, session, body) {
    const props = ['organizations', 'password']
    body = {
      ...R.pick(props, body),
      user: R.omit(props, body)
    }
    return super.createUser(network, session, body)
  }
  async createServiceProfile (network, session, body) {
    const props = ['name', 'networkServerID', 'organizationID']
    body = {
      ...R.pick(props, body),
      serviceProfile: R.omit(props, body)
    }
    return super.createServiceProfile(network, session, body)
  }
  replaceApplicationIntegration (network, session, body) {
    return super.replaceApplicationIntegration(network, session, { integration: body })
  }
  createApplication (network, session, body) {
    return super.createApplication(network, session, { application: body })
  }
  replaceApplication (network, session, body) {
    return super.replaceApplication(network, session, { application: body })
  }
  createApplicationIntegration (network, session, appId, id, body) {
    return super.createApplication(network, session, appId, id, { integration: body })
  }
}
