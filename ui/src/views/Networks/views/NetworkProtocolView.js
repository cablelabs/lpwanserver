import React from 'react';
import { Link } from 'react-router-dom';
import PT from 'prop-types';
import { isNonEmptyArray } from '../../../utils/generalUtils';
import Network from '../containers/Network';

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
  const { id, name, networkTypeId, networks } = networkProtocol;
  const brdTop = first ? 'brd-top':'';
  const createQueryParams = `?networkTypeId=${networkTypeId}&networkProtocolId=${id}`;
  const networkProtocolName = name;

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
          <Network {...{ network, networkProtocolName }} key={network.id} />
        )}
      </div> }
    </div>
  );
}
