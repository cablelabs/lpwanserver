import {
  pathOr, propOr, append, flatten, pipe, map,
  filter, reduce, reduced, curry, isNil, isEmpty
} from 'ramda';
import { findById, containesById } from './objectListUtils';
import { fieldSpecsToValues } from './inputUtils';

//******************************************************************************
// Network Protocol Functions
//******************************************************************************

export const getProtocolSet = (networkTypeId, networkProtocolId, networkProtocols) =>
pipe(
  filter(_protocolIsType(networkTypeId)), // filter out protocols of wrong network type
  reduce((acc,protoSet) => // hunt down the protocol set
    _protocolSetContainsProtocol(networkProtocolId, protoSet) ? reduced(protoSet) : acc, {})
)(networkProtocols);

export const getProtocol = (networkTypeId, networkProtocolId, networkProtocols) =>
pipe(
  filter(_protocolIsType(networkTypeId)), // filter out protocols of wrong network type
  map(pc=>pc.versions),  // gather up all of the version arrays
  flatten, // flatten all version arrays into single array of protocols
  findById(networkProtocolId), // find the one we are looking for
)(networkProtocols);

export const versionsFromProtocolSet = networkProtocolSet =>
  propOr([], 'versions', networkProtocolSet).map(proto=>
    pathOr({}, ['metaData', 'version'], proto ));

export const getProtocolVersionInfo = (networkTypeId, networkProtocolId, networkProtocolSet, network,) =>
{
  const protocolId = isNil(network) || isEmpty(network) ?
    propOr('', 'masterProtocol', networkProtocolSet) :
    propOr('', 'networkProtocolId', network);

  return pipe(
      propOr([], 'versions'),
      findById(protocolId),
      pathOr('', ['metaData', 'version'])
    )(networkProtocolSet);
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

export const getDefaultProtocol = networkProtocol =>
findById(
  propOr('', 'masterProtocol', networkProtocol),
  propOr([], 'versions', networkProtocol));

//******************************************************************************
// Internal helper fxns
//******************************************************************************

export const _protocolSetContainsProtocol = curry((protocolId, protocolSet)=>
  containesById(protocolId, propOr([], 'versions', protocolSet)));


const _protocolIsType = curry((nwTypeId, proto) => proto.networkTypeId===nwTypeId);
