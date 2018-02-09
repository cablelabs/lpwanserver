import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler} from "./helpers";
import {EventEmitter} from "events";


class NetworkProviderStore extends EventEmitter {

  getNetworkProviders() {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();

          fetch( rest_url + "/api/networkProviders",
                 {
                     method: "GET",
                     credentials: 'same-origin',
                     headers: header,
                     'Accept': 'application/json',
                     'Content-Type': 'application/json'
          })
          .then(checkStatus)
          .then((response) => response.json())
          .then((responseData) => {
              if (!responseData) {
                  resolve([]);
              }
              else {
                  resolve( responseData );
              }
          })
          .catch( err => {
              errorHandler( err );
              reject( err );
          });
      });
  }

  createNetworkProvider( name ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          let rec = { name: name };
          fetch(rest_url + "/api/networkProviders",
              {
                  method: "POST",
                  credentials: 'same-origin',
                  headers: header,
                  body: JSON.stringify( rec ),
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              }
          )
          .then(checkStatus)
          .then((response) => response.json())
          .then((responseData) => {
              // Should just be an id
              resolve( responseData.id );
          })
          .catch( function( err ) {
              reject( err );
          });
      });
  }

  getNetworkProvider( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkProviders/" + id,
              {
                  method: "GET", credentials: 'same-origin', headers: header,
                  'Accept': 'application/json', 'Content-Type': 'application/json'
              }
          )
          .then(checkStatus)
          .then((response) => response.json())
          .then((responseData) => {
              resolve( responseData );
          })
          .catch( function( err ) {
              reject( err );
          });
      });
  }

  updateNetworkProvider( updatedRec ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkProviders/" + updatedRec.id,
              {
                  method: "PUT",
                  credentials: 'same-origin',
                  headers: header,
                  body: JSON.stringify( updatedRec ),
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              }
          )
          .then(checkStatus)
          .then(() => {
              // Should just return 204
              resolve();
          })
          .catch( function( err ) {
              reject( err );
          });
      });
  }

  deleteNetworkProvider( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkProviders/" + id,
              {
                  method: "DELETE",
                  credentials: 'same-origin',
                  headers: header,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              }
          )
          .then(checkStatus)
          .then(() => {
              // Should just return 204
              resolve();
          })
          .catch( function( err ) {
              reject( err );
          });
      });
  }
}

const networkProviderStore = new NetworkProviderStore();

export default networkProviderStore;
