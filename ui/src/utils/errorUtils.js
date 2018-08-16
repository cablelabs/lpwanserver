import { prop } from 'ramda';
import dispatcher from "../dispatcher";

// givn an error string, or error object, print to console, and dispatch an error
export const  dispatchError = error => {
  const msg = prop('message', error) ? error.message : error;
  console.warn('message', msg);
  return dispatcher.dispatch({ type: "CREATE_ERROR", error: msg });
};
