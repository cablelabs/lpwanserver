import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler} from "./helpers";
import {EventEmitter} from "events";
import flyd from 'flyd'


class NetworkGroupStore extends EventEmitter {
    constructor () {
      super()
      this.groupPage = flyd.stream({ totalItems: 0, records: [] })
    }
    get groupsByNetworkTypeId () {
      return id => flyd.combine(
        x => x().records.filter(y => y.networkTypeId === id),
        [this.groupPage]
      )
    }
    async getNetworkGroups() {
      try {
        let url = `${rest_url}/api/networks/group`
        const opts = {
          credentials: 'same-origin',
          headers: sessionStore.getHeader()
        }
        const response = await fetch(url, opts).then(checkStatus).then(x => x.json())
        if (response) this.groupPage(response)
      } catch (e) {
        errorHandler(e)
        throw e
      }
    }
  }

  const networkGroupStore = new NetworkGroupStore();

  export default networkGroupStore;
