import React from 'react';
import { withRouter } from 'react-router-dom';
import { path, propOr } from 'ramda';
import BreadCrumbs from '../../components/BreadCrumbs';
import CreateOrEditNetwork from './CreateOrEditNetwork';
import FetchNetworks from '../../components/fetch/FetchNetworks';
import FetchNothing from '../../components/fetch/FetchNothing';



function NetworkLayout(props) {

  // See if we are dealing with an existing network or not
  const networkId = path([ 'match', 'params', 'networkID' ], props);
  const isNew = !networkId;

  const breadCrumbs = [
    { to: `/`, text: 'Home' },
    { to: `/admin/networks`, text: 'Networks' },
  ];

  const Fetch = isNew ? FetchNothing : FetchNetworks;
  return (
    <div className="panel-body">
      <Fetch id={networkId} render={ network => {
        return <BreadCrumbs
          trail={breadCrumbs}
          destination={ isNew ? 'CreateNetwork' : propOr('?', 'name', network) }
         />;
      }}
      />
      <CreateOrEditNetwork
        {...{ isNew, networkId }}
      />
    </div>
  );
}

export default withRouter(NetworkLayout);
