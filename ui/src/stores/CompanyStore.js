import sessionStore, {rest_url} from "./SessionStore";
import {EventEmitter} from "events";
import {checkStatus, errorHandler, remoteErrorDisplay} from "./helpers";
import userStore from "./UserStore";


class CompanyStore extends EventEmitter {

  createCompany( company ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();

          fetch( rest_url + "/api/companies/",
                 {
                     method: "POST",
                     body: JSON.stringify(company),
                     credentials: 'same-origin',
                     headers: header,
          })
          .then(checkStatus)
          .then((response) => response.json())
          .then((coresData) => {

              let user = {
                  username: company.username,
                  companyId: coresData.id,
                  password: company.password,
                  isAdmin: true,
                  email: company.email
              };
              userStore.createUser( user ).then( function ( responseData ) {
                  resolve( coresData );
              })
              .catch( ( err ) => {
                 console.log( "Error creating user for company: ", err );
              });
          })
          .catch( function ( err ) {
              errorHandler( err );
              reject( err );
          });
      });
  }

  getCompany( companyID ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch( rest_url + "/api/companies/" + companyID,
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

  updateCompany( company ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          var co = {};
          co.id = company.id;
          co.name = company.name;
          co.type = company.type;
          fetch( rest_url + "/api/companies/" + co.id,
                 {
                     method: "PUT",
                     body: JSON.stringify( co ),
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

  deleteCompany( companyId ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch( rest_url + "/api/companies/" + companyId,
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

  getAll( pageSize, offset ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          let options = "";
          if( pageSize || offset ) {
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
              }
          }
          fetch( rest_url + "/api/companies" + options,
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

  search( searchString ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch( rest_url + "/api/companies?search=" + searchString + "%",
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

  createCompanyNetworkType( coid, netid, netSettings ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          let rec = { companyId: coid,
                      networkTypeId: netid,
                      networkSettings: netSettings };
          fetch(rest_url + "/api/companyNetworkTypeLinks",
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

  getCompanyNetworkType( coid, netid ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/companyNetworkTypeLinks?companyId=" + coid + "&networkTypeId=" + netid,
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
              // Must be no more than one record - netid and coid are a compound key.
              if ( responseData && responseData.records &&
                   ( 1 === responseData.records.length ) ) {
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

  updateCompanyNetworkType( updatedRec ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/companyNetworkTypeLinks/" + updatedRec.id,
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

  deleteCompanyNetworkType( id ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/companyNetworkTypeLinks/" + id,
              {
                  method: "DELETE",
                  credentials: 'same-origin',
                  headers: header,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              }
          )
          .then(checkStatus)
          .then( (response) => response.json() )
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

  getAllCompanyNetworkTypes( companyId ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch( rest_url + "/api/companyNetworkTypeLinks?companyId=" + companyId,
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


const companyStore = new CompanyStore();

export default companyStore;
