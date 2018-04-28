import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler} from "./helpers";
import {EventEmitter} from "events";


class NetworkProtocolStore extends EventEmitter {

    getNetworkProtocolHandlers() {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();

            fetch( rest_url + "/api/networkProtocolHandlers",
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
                       resolve(responseData);
                    }
                })
                .catch( err => {
                    errorHandler( err );
                    reject( err );
                });
        });
    }

  getNetworkProtocols() {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();

          fetch( rest_url + "/api/networkProtocols",
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
                  resolve(responseData);
              }
          })
          .catch( err => {
              errorHandler( err );
              reject( err );
          });
      });
  }

  createNetworkProtocol( name, protocolHandler, networkTypeId ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          let rec = {
                      name: name,
                      protocolHandler: protocolHandler,
                      networkTypeId: networkTypeId
                    };
          fetch(rest_url + "/api/networkProtocols",
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

  getNetworkProtocol( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkProtocols/" + id,
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

  updateNetworkProtocol( updatedRec ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkProtocols/" + updatedRec.id,
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

  deleteNetworkProtocol( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkProtocols/" + id,
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

const networkProtocolStore = new NetworkProtocolStore();

export default networkProtocolStore;
