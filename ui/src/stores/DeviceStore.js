import {EventEmitter} from "events";
import "whatwg-fetch";
import sessionStore, {rest_url} from "./SessionStore";
import applicationStore from "./ApplicationStore";
import {checkStatus, errorHandler, remoteErrorDisplay} from "./helpers";

//import networkTypeStore from "./NetworkTypeStore";


class DeviceStore extends EventEmitter {

      createDevice( device ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();

              fetch( rest_url + "/api/devices/",
                     {
                         method: "POST",
                         body: JSON.stringify(device),
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

      getDevice( deviceID ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/devices/" + deviceID,
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

      updateDevice( device ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/devices/" + device.id,
                     {
                         method: "PUT",
                         body: JSON.stringify( device ),
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

      deleteDevice( deviceId ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/devices/" + deviceId,
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

      getAll( pageSize, offset, applicationId ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              let options = "";
              if( pageSize || offset || applicationId ) {
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
                  if ( applicationId ) {
                      if ( needsAnd ) {
                          options += "&";
                      }
                      options += "applicationId=" + applicationId;
                      needsAnd = true;
                  }
              }

              fetch( rest_url + "/api/devices" + options,
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

      createDeviceProfile( name, desc, coid, netid, netSettings ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              let rec = { name: name,
                          description: desc,
                          networkTypeId: netid,
                          companyId: coid,
                          networkSettings: netSettings };
        console.log( "Sending:", rec );
              fetch(rest_url + "/api/deviceProfiles",
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
                  // Should just be an id
                  resolve( responseData.id );
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      getDeviceProfile( dpid ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/deviceProfiles/" + dpid,
                  {
                      method: "GET", credentials: 'same-origin', headers: header,
                      'Accept': 'application/json', 'Content-Type': 'application/json'
                  }
              )
              .then(checkStatus)
              .then((response) => response.json())
              .then((responseData) => {
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  resolve( responseData );
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      updateDeviceProfile( updatedRec ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/deviceProfiles/" + updatedRec.id,
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

      deleteDeviceProfile( id ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/deviceProfiles/" + id,
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

      getAllDeviceProfiles( pageSize, offset, companyId ) {
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
              fetch( rest_url + "/api/deviceProfiles" + options,
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
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  resolve( responseData );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      getAllDeviceProfilesForAppAndNetType( appId, netId ) {
          return new Promise( async function( resolve, reject ) {
              let app = await applicationStore.getApplication( appId );
              let header = sessionStore.getHeader();
              fetch( rest_url + "/api/deviceProfiles?companyId=" + app.companyId + "&networkTypeId=" + netId,
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
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  resolve( responseData );
              })
              .catch( function ( err ) {
                  errorHandler( err );
                  reject( err );
              });
          });
      }

      createDeviceNetworkType( devid, netid, devProId, netSettings ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              let rec = { deviceId: devid,
                          networkTypeId: netid,
                          deviceProfileId: devProId,
                          networkSettings: netSettings };
              fetch(rest_url + "/api/deviceNetworkTypeLinks",
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
                  // Should just be an id
                  resolve( responseData.id );
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      getDeviceNetworkType( devid, netid ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/deviceNetworkTypeLinks?deviceId=" + devid + "&networkTypeId=" + netid,
                  {
                      method: "GET", credentials: 'same-origin', headers: header,
                      'Accept': 'application/json', 'Content-Type': 'application/json'
                  }
              )
              .then(checkStatus)
              .then((response) => response.json())
              .then((responseData) => {
                  // Handle potential for remote errors
                  remoteErrorDisplay( responseData );
                  // Must be no more than one record - netid and appid are a compound key.
                  if ( responseData && responseData.records &&
                       ( 1 === responseData.records.length ) ) {
                      resolve( responseData.records[ 0 ] );
                  }
                  else {
                      console.log( responseData );
                      reject( 404 );
                  }
              })
              .catch( function( err ) {
                  reject( err );
              });
          });
      }

      updateDeviceNetworkType( updatedRec ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/deviceNetworkTypeLinks/" + updatedRec.id,
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

      deleteDeviceNetworkType( id ) {
          return new Promise( function( resolve, reject ) {
              let header = sessionStore.getHeader();
              fetch(rest_url + "/api/deviceNetworkTypeLinks/" + id,
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
}

const deviceStore = new DeviceStore();

export default deviceStore;
