import { curry, propEq, find, findIndex } from 'ramda';

//******************************************************************************
// Utils dealing with lists of objects
//******************************************************************************

// return index of first obj in list with supplied matching { propName: propVal },
// reutrn -1 if no match
// '' -> '' -> [{}] -> int
export const idxByPropVal = curry((propName, propVal, objList) =>
  findIndex(propEq(propName, propVal), objList));

// reutrn true if one of the objects in list has matching { propName: propVal },
// return false otherwise
// '' -> '' -> [{}] -> bool
export const containesByPropVal = curry((propName, propVal, objList) =>
  idxByPropVal(propName, propVal, objList) > -1);

// return first object in list with matching { propName: propVal }
// return undefined if no matches
// '' -> '' -> [{}] -> {}
export const findByPropVal = curry((propName, propVal, objList) =>
  find(propEq(propName, propVal),objList));

//******************************************************************************
// Utils dealing with lists of objects with 'id' prop
//******************************************************************************

// return index of first obj in list with supplied id, -1 if no match
// '' -> [{}] -> int
export const idxById = idxByPropVal('id');

// reutrn true if one of the objects in list has a matching id, otherwise false
// '' -> [{}] -> bool
export const containesById = containesByPropVal('id');

// return first object in list with matching id, or undefined if no matches
// '' -> [{}] -> {}
export const findById = findByPropVal('id');
