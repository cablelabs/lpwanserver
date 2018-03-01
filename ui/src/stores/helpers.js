import dispatcher from "../dispatcher";

export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    throw response;
  }
}

export function errorHandler(error) {
  console.log("error", error);

  if (error.status === 404) {
    return;
  }

  dispatcher.dispatch({
    type: "CREATE_ERROR",
    error: error
  });

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
