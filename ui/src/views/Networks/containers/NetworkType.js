import React from 'react';
import PT from 'prop-types';
import NetworkProtocolView from '../views/NetworkProtocolView';
import networkStore from "../../../stores/NetworkStore";
import connect from '../../../utils/connectStore'

//******************************************************************************
// Interface
//******************************************************************************
NetworkType.propTypes = {
  networkType: PT.object, // the network type to dislpay
  first: PT.bool
};

NetworkType.defaultProps = {
  networkType: {},
  first: false
};

//******************************************************************************
// NetworkType
//******************************************************************************
export function NetworkType (props) {
  const mrgTop = props.first ? '' : 'mrg-t-30';
  return (
    <div>
      <div className={`txt-color-alt fs-sm ${mrgTop}`}>
        {props.networkType.name || '?'} Networks
      </div>
      {props.groups.map((x, i) => (
        <NetworkProtocolView networkProtocol={x} key={x.masterProtocol} first={i === 0} />
      ))}
    </div>
  );
}

export default connect({
  state: {
    groups: {
      stream: () => networkStore.groupsByNetworkTypeId,
      map: (fn, props) => fn(props.networkType.id)
    }
  }
})(NetworkType)
