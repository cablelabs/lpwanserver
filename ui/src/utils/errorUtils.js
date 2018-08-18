import dispatcher from "../dispatcher";

export const errorToText = e =>
  e && e.message ? e.message :
  e && e.statusText ? e.statusText : e;

// givn an error string, or error object, print to console, and dispatch an error
export const  dispatchError = error => {
  const msg = errorToText(error);
  console.warn('message', msg);
  return dispatcher.dispatch({ type: "CREATE_ERROR", error: msg });
};
