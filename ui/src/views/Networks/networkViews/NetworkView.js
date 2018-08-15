import React from 'react';
import PT from 'prop-types';
import { withRouter } from 'react-router-dom';
import { pathOr, propOr } from 'ramda';
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
  const { id, name, securityData } = network;
  const authorizied = propOr(false, 'authorized', securityData);
  const routeTo = pathOr(noop, ['history', 'push'], props);
  const statusGlyph = authorizied ?
    'glyphicon-transfer text-success' : 'glyphicon-remove-circle text-danger';

  return (
    <div className='flex-row jc-sb fs-xs'>
      <div className='w-min-200 fs-sm'>{name}</div>
      <label>
        <input className='xbox-small'
        type="checkbox" checked={true} onChange={()=>null}/> Enabled
      </label>
      <div
        className={`glyphicon fs-sm ${statusGlyph}`}
      />
      <div
        className="glyphicon glyphicon-pencil fs-sm mrg-r-20 cur-ptr"
        onClick={()=>routeTo(`/admin/network/${id}`)}
      />
    </div>
  );
}
export default withRouter(NetworkView);
