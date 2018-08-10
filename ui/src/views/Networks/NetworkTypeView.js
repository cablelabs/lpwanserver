import React from 'react';
import PT from 'prop-types';
import { isNotArray } from 'ramda-adjunct';
import FetchNetworkProtocols from '../../components/fetch/FetchNetworkProtocols';
import NetworkProtocolView from './NetworkProtocolView';

//******************************************************************************
// Interface
//******************************************************************************

NetworkTypeView.propTypes = {
  networkType: PT.object // the network type to dislpay
};

NetworkTypeView.defaultProps = {
  networkType: {}
};

//******************************************************************************
// NetworkTypeView
//******************************************************************************

export default function NetworkTypeView({networkType}) {
  const { id, name } = networkType;
  return (
    <div>
      <div className='txt-color-alt fs-s mb-5'>
        {name||'?'} Networks
      </div>
      <FetchNetworkProtocols
        filter={np=>np.networkTypeId===id}
        render={ networkProtocol =>
          isNotArray(networkProtocol) ? <div></div> :
          networkProtocol.map((networkProtocol,key) =>
            <NetworkProtocolView {...{networkProtocol, key}}
              first={key===0}
            />
        )}/>
    </div>
  );
}
