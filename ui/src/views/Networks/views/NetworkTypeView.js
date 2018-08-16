import React from 'react';
import PT from 'prop-types';
import { isNotArray } from 'ramda-adjunct';
import FetchNetworkProtocols from '../../../components/fetch/FetchNetworkProtocols';
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

export default function NetworkTypeView(props) {
  const { networkType, first } = props;
  const { id, name } = networkType;
  const mrgTop = first ? '' : 'mrg-t-30';
  return (
    <div>
      <div className={`txt-color-alt fs-sm ${mrgTop}`}>
        {name||'?'} Networks
      </div>
      <FetchNetworkProtocols
        filter={np=>np.networkTypeId===id} render={ networkProtocols =>
          isNotArray(networkProtocols) ?
          <div></div> :
          networkProtocols.map((networkProtocol,key) =>
            <NetworkProtocolView
              {...{networkProtocol, key}} first={key===0}
            />
        )}/>
    </div>
  );
}
