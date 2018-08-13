import React from 'react';
import PT from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { pathOr } from 'ramda';
import { noop } from 'ramda-adjunct';


//******************************************************************************
// Interface
//******************************************************************************

NetworkView.propTypes = {
  network: PT.object, // the network to dislpay
};

NetworkView.defaultProps = {
  network: {}
};

//******************************************************************************
// NetworkView
//******************************************************************************

function NetworkView(props) {

  const { network={} } = props;
  const routeTo = pathOr(noop, ['history', 'push'], props);

  return (
    <div className='flex-row-sb fs-xs'>
      <div className='w-min-200 fs-sm'
      >{network.name}</div>
      <label>
        <input className='xbox-small'
        type="checkbox" name="supportsJoin" checked={true} onChange={()=>null}/>
        Enabled
      </label>
      <Link to='/admin/networks2'>test connection</Link>
        <div
          className="glyphicon glyphicon-pencil fs-sm mrg-r-20 cur-ptr"
          onClick={()=>routeTo(`/admin/network/${network.id}`)}
        />
    </div>
  );
}

export default withRouter(NetworkView);

// { networks.map((network,key) =>
//   <div
//     {...{key}}>{network.name} </div>
// )}


// networks.map((network,key) =>
//   <div {...{key}}>{network.name} </div>
// )
