import dispatcher from "../dispatcher";

export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    throw response;
  }
}

export function errorHandler(error) {
  if ( error.status && error.status === 404) {
    return;
  }

  if ( error.text ) {
      error.text().then( (text) => {
          error.moreInfo = text;

          dispatcher.dispatch({
              type: "CREATE_ERROR",
              error: error
          });
      })
      .catch( (err) => {
          dispatcher.dispatch({
              type: "CREATE_ERROR",
              error: error
          });
      });
  }
  else if ( error.toString ) {
      dispatcher.dispatch({
          type: "CREATE_ERROR",
          error: error.toString()
      });
  }
  else {
      dispatcher.dispatch({
          type: "CREATE_ERROR",
          error: error
      });
  }

}

export function remoteErrorDisplay( returnedRec ) {
    // We may have an object of remoteAccessLogs, but are there errors?
    if ( returnedRec.remoteAccessLogs ) {
        let hasErrors = false;
        let ral = returnedRec.remoteAccessLogs;
        for ( var networkId in ral ) {
            if ( ral[ networkId ].logs &&
                 ( ral[ networkId ].logs.length > 0 ) ) {
                hasErrors = true;
            }
        }

        if ( hasErrors ) {
            dispatcher.dispatch( {
                type: "CREATE_ERROR",
                error: returnedRec.remoteAccessLogs,
            });
        }
    }
}
