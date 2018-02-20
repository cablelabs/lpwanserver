import {EventEmitter} from "events";
import "whatwg-fetch";
import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler, remoteErrorDisplay} from "./helpers";

//import networkTypeStore from "./NetworkTypeStore";


class ApplicationStore extends EventEmitter {

      createApplication( application ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();

              fetch( rest_url + "/api/applications/",
                     {
                         method: "POST",
                         body: JSON.stringify(application),
                         credentials: 'same-origin',
                         headers: header,
              })
              .then(checkStatus)
              .then((response) => response.json())
              .then((responseData) => {
                  resolve( responseData );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      getApplication( applicationID ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/applications/" + applicationID,
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
                  resolve( responseData );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      updateApplication( application ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/applications/" + application.id,
                     {
                         method: "PUT",
                         body: JSON.stringify( application ),
                         credentials: 'same-origin',
                         headers: header,
                         'Accept': 'application/json',
                         'Content-Type': 'application/json'
              })
              .then(checkStatus)
              .then((response) => {
                  resolve();
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      deleteApplication( applicationId ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/applications/" + applicationId,
                     {
                         method: "DELETE",
                         credentials: 'same-origin',
                         headers: header,
                         'Accept': 'application/json',
                         'Content-Type': 'application/json'
              })
              .then(checkStatus)
              .then((response) => {
                  resolve();
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      getAll( pageSize, offset, companyId ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              let options = "";
              if( pageSize || offset || companyId ) {
                  options += "?";
                  let needsAnd = false;
                  if ( pageSize ) {
                      options += "limit=" + pageSize;
                      needsAnd = true;
                  }
                  if ( offset ) {
                      if ( needsAnd ) {
                          options += "&";
                      }
                      options += "offset=" + offset;
                      needsAnd = true;
                  }
                  if ( companyId ) {
                      if ( needsAnd ) {
                          options += "&";
                      }
                      options += "companyId=" + companyId;
                      needsAnd = true;
                  }
              }

              fetch( rest_url + "/api/applications" + options,
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
                  resolve( responseData );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      startApplication( id ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();

              fetch( rest_url + "/api/applications/" + id + "/start",
                     {
                         method: "POST",
                         credentials: 'same-origin',
                         headers: header,
              })
              .then(checkStatus)
              .then(( responseData ) => {
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  resolve( );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      stopApplication( id ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();

              fetch( rest_url + "/api/applications/" + id + "/stop",
                     {
                         method: "POST",
                         credentials: 'same-origin',
                         headers: header,
              })
              .then(checkStatus)
              .then((responseData) => {
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  resolve( );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      createApplicationNetworkType( appid, netid, netSettings ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              let rec = { applicationId: appid,
                          networkTypeId: netid,
                          networkSettings: netSettings };
              fetch(rest_url + "/api/applicationNetworkTypeLinks",
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
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  // Return the ID
                  resolve( responseData.id );
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      getApplicationNetworkType( appid, netid ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/applicationNetworkTypeLinks?applicationId=" + appid + "&networkTypeId=" + netid,
                  {
                      method: "GET", credentials: 'same-origin', headers: header,
                      'Accept': 'application/json', 'Content-Type': 'application/json'
                  }
              )
              .then(checkStatus)
              .then((response) => response.json())
              .then((responseData) => {
                  // Must be no more than one record - netid and appid are a compound key.
                  if ( responseData && responseData.records &&
                       ( 1 === responseData.records.length ) ) {
                       // Handle potential for remote errors
                       remoteErrorDisplay( responseData );
                      resolve( responseData.records[ 0 ] );
                  }
                  else {
                      reject( 404 );
                  }
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      updateApplicationNetworkType( updatedRec ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/applicationNetworkTypeLinks/" + updatedRec.id,
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
              .then((responseData) => {
                  // Should just return 204
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  resolve();
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      deleteApplicationNetworkType( id ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/applicationNetworkTypeLinks/" + id,
                  {
                      method: "DELETE",
                      credentials: 'same-origin',
                      headers: header,
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                  }
              )
              .then(checkStatus)
              .then((responseData) => {
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  // Should just return 204
                  resolve();
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      getAllApplicationNetworkTypes( applicationId ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/applicationNetworkTypeLinks?applicationId=" + applicationId,
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
                  resolve( responseData.records );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

}

const applicationStore = new ApplicationStore();

export default applicationStore;
