import { pathOr, propOr, append } from 'ramda';
import { findById } from './objectListUtils';
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
