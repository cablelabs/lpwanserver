import { replace } from 'ramda';


export const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
export const removeUnderscores = str => replace(/_/g, ' ', str); // TODO: not working
