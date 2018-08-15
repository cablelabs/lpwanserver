import React from 'react';
import { Link } from 'react-router-dom';
import PT from 'prop-types';
import { isNotArray } from 'ramda-adjunct';
import FetchNetworks from '../../../components/fetch/FetchNetworks';
import NetworkView from './NetworkView';
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
  const { id, name, networkTypeId } = networkProtocol;
  const brdTop = first ? 'brd-top':'';
  const createQueryParams = `?networkTypeId=${networkTypeId}&networkProtocolId=${id}`;

  return (
    <div className={`pad-v-10 brd-bot ${brdTop}`}>
      <div className={`flex-row jc-sb`}>
        <div className='fs-md'>{name}</div>
        <Link to={`/admin/network${createQueryParams}`}>
          <button type="button" className="btn btn-default btn-sm">Create</button>
        </Link>
      </div>
      <FetchNetworks
        filter={np=>np.networkProtocolId===id} render={ networks =>
          isNotArray(networks) || networks.length===0 ?
          <div></div> :
          <div className={'bgc-gry-lt inner-shadow pad-10 mrg-t-20'}> {
            networks.map((network,key) =>
              <NetworkView {...{ network, key }}/>)}
          </div>
        }/>
    </div>
  );
}
