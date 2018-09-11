import sessionStore, {rest_url} from "./SessionStore";
import {errorHandler, fetchJson} from "./helpers";
import {EventEmitter} from "events";
import Collection from './collection'

class NetworkProtocolStore extends EventEmitter {
  constructor () {
    super()
    this.baseUrl = `${rest_url}/api/networkProtocols`
    this.protocols = new Collection()
    this.protocolHandlers = new Collection()
  }
  async getNetworkProtocolHandlers () {
    const url = `${rest_url}/api/networkProtocolHandlers`
    try {
      const response = await fetchJson(url, {
        headers: sessionStore.getHeader()
      })
      if (!response || !response.records) return []
      this.protocolHandlers.insert(response.records)
      return response
    } catch (err) {
      errorHandler(err)
      throw err
    }
  }
  async getNetworkProtocols () {
    try {
      const response = await fetchJson(this.baseUrl, {
        headers: sessionStore.getHeader()
      })
      if (!response || !response.records) return []
      this.protocols.insert(response.records)
      return response
    } catch (err) {
      errorHandler(err)
      throw err
    }
  }
  async createNetworkProtocol (name, protocolHandler, networkTypeId) {
    const rec = { name, protocolHandler, networkTypeId }
    const response = await fetchJson(this.baseUrl, {
      method: 'post',
      headers: sessionStore.getHeader(),
      body: JSON.stringify(rec)
    })
    this.protocols.insert(response)
    return response.id
  }
  async getNetworkProtocol (id) {
    const response = await fetchJson(`${this.baseUrl}/${id}`, {
      headers: sessionStore.getHeader()
    })
    this.protocols.insert(response)
    return response
  }
  async updateNetworkProtocol (rec) {
    const response = await fetchJson(`${this.baseUrl}/${rec.id}`, {
      method: 'put',
      headers: sessionStore.getHeader(),
      body: JSON.stringify(rec)
    })
    this.protocols.insert(response)
    return
  }
  async deleteNetworkProtocol (id) {
    await fetchJson(`${this.baseUrl}/${id}`, {
      method: 'delete',
      headers: sessionStore.getHeader(),
    })
    return
  }
}

const networkProtocolStore = new NetworkProtocolStore();

export default networkProtocolStore;
