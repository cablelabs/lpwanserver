import dispatcher from "../dispatcher";

// givn an error string, it is printed to console, and an error is dispatched
export const  dispatchError = errorMsg => {
  console.warn(errorMsg);
  return dispatcher.dispatch({ type: "CREATE_ERROR", error: errorMsg });
};
