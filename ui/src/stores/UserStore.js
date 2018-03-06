import {EventEmitter} from "events";
import "whatwg-fetch";
import sessionStore, {rest_url} from "./SessionStore";
import {checkStatus, errorHandler} from "./helpers";

class UserStore extends EventEmitter {

    getAll( pageSize, offset, companyId ) {
        return new Promise( function( resolve, reject ) {
            let header = sessionStore.getHeader();
            let options = "";
            if ( pageSize || offset || companyId ) {
                options = "?";
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
            fetch( rest_url + "/api/users" + options,
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
            .catch( (err) => {
                console.log( "Error retrieving users:" + err );
                errorHandler( err );
                reject( err );
            });
        });
    }

  getUser( userID ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/users/" + userID,
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
           .catch( (err) => {
               errorHandler( err );
               reject( err );
           });
      });
  }

  getUserMe() {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/users/me",
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
          .catch( ( err ) => {
              errorHandler( err );
              reject( err );
          });
      });
  }

  createUser( user ) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();

          // Convert isAdmin to a role.
          if (user.isAdmin) {
              user.role = "admin";
          }
          else {
              user.role = "user";
          }
          delete user['isAdmin'];

          // Add in the company if not specified.  Same as current user.
          if ( !user.companyId ) {
              var u = sessionStore.getUser();
              user.companyId = u.companyId;
          }

          console.log("Create User", JSON.stringify(user));
          fetch(rest_url + "/api/users/",
                {
                    method: "POST",
                    body: JSON.stringify(user),
                    headers: header,
                }
          )
          .then(checkStatus)
          .then((response) => response.json())
          .then((responseData) => {
              resolve( responseData );
          })
          .catch( ( err ) => {
              errorHandler( err );
              reject( err );
          });
      });
  }

  updateUser( user ) {
      return new Promise( function( resolve, reject ) {
          console.log( "Running request", user );
          console.log( "URL base", rest_url );
          let header = sessionStore.getHeader();
          console.log( "Header:", header );
          fetch(rest_url + "/api/users/" + user.id,
                {
                    method: "PUT",
                    body: JSON.stringify(user),
                    credentials: 'same-origin',
                    headers: header,
                }
          )
          .then(checkStatus)
          .then((responseData) => {
              console.log( "Callback calling", responseData);
              resolve( responseData );
          })
          .catch( (err) => {
              console.log( "Error Updating User", err );
              errorHandler(err);
              reject(err);
          });
      });
  }

  deleteUser(userID) {
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch(rest_url + "/api/users/" + userID,
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
              resolve(responseData);
          })
          .catch(errorHandler);
      });
  }

  deleteUsersForCompany( companyId ) {
      let me = this;
      return new Promise( function( resolve, reject ) {
          let header = sessionStore.getHeader();
          fetch( rest_url + "/api/users?companyId=" + companyId,
                 {
                     method: "GET",
                     credentials: 'same-origin',
                     headers: header,
                     'Accept': 'application/json',
                     'Content-Type': 'application/json'
          })
          .then(checkStatus)
          .then((response) => response.json() )
          .then((responseData) => {
              responseData.records.forEach( ( user ) => {
                  me.deleteUser( user.id, ( response ) => {
                     // Deleted, great.
                  });
              });
              resolve();
          })
          .catch( (err) => reject( err ) );
      });
  }


}


const userStore = new UserStore();

export default userStore;
