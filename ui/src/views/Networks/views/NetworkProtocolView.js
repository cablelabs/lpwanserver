import React from 'react';
import { Link } from 'react-router-dom';
import PT from 'prop-types';
import { propOr } from 'ramda';
import { isNonEmptyArray } from '../../../utils/generalUtils';
import Network from '../containers/Network';
import networkStore from "../../../stores/NetworkStore";
import connect from '../../../utils/connectStore'

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
function NetworkProtocolView (props) {
  const { first, networkProtocol, networks } = props;
  const { name, networkTypeId } = networkProtocol;
  const masterProtocol = propOr('', 'masterProtocol', networkProtocol);
  const createQueryParams = `?networkTypeId=${networkTypeId}&masterProtocol=${masterProtocol}`;
  const brdTop = first ? 'brd-top':'';

  return (
    <div className={`pad-v-10 brd-bot ${brdTop}`}>
      <div className='flex-row jc-sb'>
        <div className='fs-lg w-min-200'>{name}</div>
        {/* !isNonEmptyArray(networks) && <div>{`No ${name} Netowrks`}</div> - address alignemnt issue*/ }
        <Link to={`/admin/network${createQueryParams}`}>
          <button type="button" className="btn btn-default btn-sm">Create</button>
        </Link>
      </div>
      { isNonEmptyArray(networks) &&
      <div className={'bgc-gry-lt inner-shadow pad-10 mrg-t-20'}>
        {networks.map(network =>
          <Network {...{ network, networkProtocol }} key={network.id} />
        )}
      </div> }
    </div>
  );
}

export default connect({
  state: {
    networks: {
      stream: () => networkStore.networksByMasterProtocol,
      map: (fn, props) => fn && fn(props.networkProtocol.masterProtocol)
    }
  }
})(NetworkProtocolView)
