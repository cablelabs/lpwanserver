import sessionStore, {rest_url} from "./SessionStore";
import {errorHandler, fetchJson, paginationQuery} from "./helpers";
import {EventEmitter} from "events";
import Collection from './collection'
import flyd from 'flyd'
import { omit } from 'ramda'

class NetworkStore extends EventEmitter {
  constructor () {
    super()
    this.baseUrl = `${rest_url}/api/networks`

    // state
    this.networks = new Collection()
    this.networkPage = flyd.stream({ totalCount: 0, records: [] })
    this.groups = new Collection({ idKey: 'masterProtocol' })

    // computed state
    this.groupsByNetworkTypeId = this.groups.filter('networkTypeId')
    this.networksByMasterProtocol = this.networks.filter(
      'masterProtocol',
      (a,b) => b.networkProtocolId < a.networkProtocolId
    )
  }

  // actions
  async getNetworks( pageSize, offset ) {
    const pgQuery = paginationQuery(pageSize, offset);
    const url = `${this.baseUrl}${pgQuery ? '?' : ''}${pgQuery}`
    try {
      const response = await fetchJson(url, { headers: sessionStore.getHeader() })
      if (!response) return
      this.networkPage(response)
      this.networks.insert(response.records)
      return response
    } catch (err) {
      errorHandler(err)
      throw err
    }
  }
  async getNetworkGroups() {
    try {
      const response = await fetchJson(`${this.baseUrl}/group`, {
        headers: sessionStore.getHeader()
      })
      if (!response) return
      response.records.forEach(record => {
        this.networks.insert(record.networks.map(x => ({
          ...x,
          masterProtocol: record.masterProtocol
        })))
      })
      this.groups.insert(response.records.map(x => omit(['networks'], x)))
    } catch (e) {
      errorHandler(e)
      throw e
    }
  }
  async createNetwork (rec) {
    const response = await fetchJson(this.baseUrl, {
      method: 'post',
      headers: sessionStore.getHeader(),
      body: JSON.stringify(rec)
    })
    this.networks.insert(response)
    return response
  }
  async getNetwork (id) {
    const response = await fetchJson(`${this.baseUrl}/${id}`, {
      headers: sessionStore.getHeader()
    })
    this.networks.insert(response)
    return response
  }
  async updateNetwork (rec) {
    const response = await fetchJson(`${this.baseUrl}/${rec.id}`, {
      method: 'put',
      headers: sessionStore.getHeader(),
      body: JSON.stringify(rec)
    })
    this.networks.insert(response)
    return response
  }
  async deleteNetwork (id) {
    await fetchJson(`${this.baseUrl}/${id}`, {
      method: 'delete',
      headers: sessionStore.getHeader(),
    })
    return
  }
  async pullNetwork (id) {
    await fetchJson(`${this.baseUrl}/${id}/pull`, {
      method: 'post',
      headers: sessionStore.getHeader()
    })
    return
  }
}

const networkStore = new NetworkStore();

export default networkStore;
