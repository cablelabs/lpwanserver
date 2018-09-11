import {
  pathOr, propOr, append, flatten, pipe, map,
  filter, reduce, reduced, curry, isNil, isEmpty
} from 'ramda';
import { findById, containesById } from './objectListUtils';
import { fieldSpecsToValues } from './inputUtils';

//******************************************************************************
// Network Protocol Functions
//******************************************************************************
export const getNetworkFields = networkProtocol =>
  pathOr([], ['metaData', 'protocolHandlerNetworkFields'], networkProtocol);

export const getSecurityProps = networkProtocol => {
  const protoFields = getNetworkFields(networkProtocol);
  return protoFields.reduce((propAccum,curField)=>                 // always send authorized flag
    curField.name ? append( curField.name, propAccum) : propAccum, ['authorized']);
};

export const getSecurityDefaults = networkProtocol => {
  const networkFields = getNetworkFields(networkProtocol);
  return fieldSpecsToValues(networkFields);
};

export const getDefaultProtocol = networkProtocol =>
findById(
  propOr('', 'masterProtocol', networkProtocol),
  propOr([], 'versions', networkProtocol));
