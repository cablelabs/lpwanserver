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
