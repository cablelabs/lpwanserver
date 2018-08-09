import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { path, propOr } from 'ramda';
import CreateOrEditNetwork from './CreateOrEditNetwork';
import FetchNetwork from '../../components/fetch/FetchNetwork';


function NetworkLayout(props) {

  // See if we are dealing with an existing network or not
  const networkId = path([ 'match', 'params', 'networkID' ], props);
  const isNew = !networkId;

  const breadCrumbs = [
    { to: `/`, text: 'Home' },
    { to: `/admin/networks`, text: 'Networks' },
  ];

  return (
    <div className="panel-body">
      <FetchNetwork networkId={networkId} render={ network =>
         <BreadCrumbs
           trail={breadCrumbs}
           destination={ isNew ? 'CreateNetwork' : propOr('?', 'name', network) }
         />
       }
      />
      <CreateOrEditNetwork
        {...{ isNew, networkId }}
      />
    </div>
  );
}

export default withRouter(NetworkLayout);

//******************************************************************************
// Helper components
//******************************************************************************

function BreadCrumbs({trail, destination}) {
  return (
    <ol className="breadcrumb">
      { trail.map((c,key)=><li key={key}><Link to={c.to}>{c.text}</Link></li>) }
      <li className="active">{destination}</li>
    </ol>
  );
}
