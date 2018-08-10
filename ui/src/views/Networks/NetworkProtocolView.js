import React from 'react';
import PT from 'prop-types';

//******************************************************************************
// Interface
//******************************************************************************

NetworkProtocolView.propTypes = {
  networkProtocol: PT.object, // the network protocol to dislpay
  first: PT.bool              // is this the first entry in a list?
};

NetworkProtocolView.defaultProps = {
  networkProtocol: {}
};

//******************************************************************************
// NetworkProtocolView
//******************************************************************************

export default function NetworkProtocolView(props) {
  const { first, networkProtocol } = props;
  const { id, name } = networkProtocol;
  return (
    <div className={`nl-nwproto-container ${first?'brd-top':''}`}>
      <div className='fs-l'>{name||'?'}</div>
    </div>
  );
}
