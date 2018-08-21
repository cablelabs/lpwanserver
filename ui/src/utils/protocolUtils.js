import { pathOr, append } from 'ramda';
import { idxById } from './objectListUtils';
import { fieldSpecsToValues } from './inputUtils';

export const getProtocol = (networkProtocolId, networkProtocols) => {
  const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
  return networkProtocols[networkProtocolIndex];
};

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
