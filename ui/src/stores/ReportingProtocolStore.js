import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler} from "./helpers";
import {EventEmitter} from "events";


class ReportingProtocolStore extends EventEmitter {

  getReportingProtocolHandlers() {
    return new Promise( function( resolve, reject ) {
      let header = sessionStore.getHeader();

      fetch( rest_url + "/api/reportingProtocolHandlers",
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

  getReportingProtocols() {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();

          fetch( rest_url + "/api/reportingProtocols",
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

  createReportingProtocol( name, protocolHandler ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          let rec = {
                      name: name,
                      protocolHandler: protocolHandler
                    };
          fetch(rest_url + "/api/reportingProtocols",
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

  getReportingProtocol( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/reportingProtocols/" + id,
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

  updateReportingProtocol( updatedRec ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/reportingProtocols/" + updatedRec.id,
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

  deleteReportingProtocol( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/reportingProtocols/" + id,
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

const reportingProtocolStore = new ReportingProtocolStore();

export default reportingProtocolStore;
