import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler} from "./helpers";
import {EventEmitter} from "events";


class NetworkStore extends EventEmitter {
    getNetworks( pageSize, offset ) {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();

            let options = "";

            if ( pageSize || offset ) {
                options += "?";
                if ( pageSize ) {
                    options += "limit=" + pageSize;
                    if ( offset ) {
                        options += "&";
                    }
                }
                if ( offset ) {
                    options += "offset=" + offset;
                }
            }

            fetch( rest_url + "/api/networks" + options,
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
                    resolve({ totalCount: 0, records: [] });
                }
                else {
                    console.log(responseData);
                    resolve(responseData);
                }
            })
            .catch( err => {
                errorHandler( err );
                reject( err );
            });
        });
    }

    createNetwork( name, networkProviderId, networkTypeId, networkProtocolId, baseUrl, securityData  ) {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();
            let rec = {
                        name: name,
                        networkProviderId: networkProviderId,
                        networkTypeId: networkTypeId,
                        networkProtocolId: networkProtocolId,
                        baseUrl: baseUrl,
                        securityData: securityData,
                      };
            fetch(rest_url + "/api/networks",
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

    getNetwork( id ) {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();
            fetch(rest_url + "/api/networks/" + id,
                {
                    method: "GET",
                    credentials: 'same-origin',
                    headers: header,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
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

    updateNetwork( updatedRec ) {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();
    console.log( "NetworkStore: updatedRec:", updatedRec );
            fetch(rest_url + "/api/networks/" + updatedRec.id,
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

    deleteNetwork( id ) {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();
            fetch(rest_url + "/api/networks/" + id,
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

    pullNetwork( id ) {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();
            fetch(rest_url + "/api/networks/" + id + "/pull",
                {
                    method: "POST",
                    credentials: 'same-origin',
                    headers: header,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            )
                .then(checkStatus)
                .then(() => {
                    // Should just return 200
                    resolve();
                })
                .catch( function( err ) {
                    reject( err );
                });
        });
    }
  }

  const networkStore = new NetworkStore();

  export default networkStore;
