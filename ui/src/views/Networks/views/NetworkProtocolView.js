import React from 'react';
import { Link } from 'react-router-dom';
import PT from 'prop-types';
import { propOr } from 'ramda';
import { isNonEmptyArray } from '../../../utils/generalUtils';
import { containesById } from '../../../utils/objectListUtils';
import FetchNetworks from '../../../components/fetch/FetchNetworks';
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
  const { name, networkTypeId } = networkProtocol;

  // For network create default to master protocol
  // const protocolIds = propOr([], 'versions', networkProtocol).map(proto=>proto.id);
  const defaultProtocolId = propOr('', 'masterProtocol', networkProtocol);
  const createQueryParams = `?networkTypeId=${networkTypeId}&networkProtocolId=${defaultProtocolId}`;

  const filterNw = nw =>
    containesById(nw.networkProtocolId, propOr([], 'versions', networkProtocol));

  const brdTop = first ? 'brd-top':'';

    return (
    <div className={`pad-v-10 brd-bot ${brdTop}`}>
      <FetchNetworks
        filter={filterNw}
        render={ networks =>
        <div>
          <div className='flex-row jc-sb'>
            <div className='fs-lg w-min-200'>{name}</div>
            <Link to={`/admin/network${createQueryParams}`}>
              <button type="button" className="btn btn-default btn-sm">Create</button>
            </Link>
          </div>
          { isNonEmptyArray(networks) &&
            <div className={'bgc-gry-lt inner-shadow pad-10 mrg-t-20'}> {
              networks.map((network,key) =>
                <Network {...{ network, networkProtocol, key }}/>)}
            </div>}
        </div>
      }/>
    </div>
  );
}
