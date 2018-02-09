import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler} from "./helpers";
import {EventEmitter} from "events";


class NetworkTypeStore extends EventEmitter {

  getNetworkTypes() {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();

          fetch( rest_url + "/api/networkTypes",
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

  createNetworkType( name ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          let rec = { name: name };
          fetch(rest_url + "/api/networkTypes",
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

  getNetworkType( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkTypes/" + id,
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

  updateNetworkType( updatedRec ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkTypes/" + updatedRec.id,
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

  deleteNetworkType( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/networkTypes/" + id,
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

const networkTypeStore = new NetworkTypeStore();

export default networkTypeStore;
