import React from 'react';
import PT from 'prop-types';
import { propOr } from 'ramda';
import { noop } from 'ramda-adjunct';


//******************************************************************************
// Interface
//******************************************************************************

NetworkView.propTypes = {
  network: PT.object, // the network to dislpay
  onEdit: PT.func, // called when edit button hit
  onToggleEnabled: PT.func, // called when network enabled/disabled.  Sig: onEnable(true|false)
};

NetworkView.defaultProps = {
  network: {},
  onToggleEnabled: noop,
  onEdit: noop,
};

//******************************************************************************
// NetworkView
//******************************************************************************

export default function NetworkView(props) {

  const { network={}, onToggleEnabled, onEdit } = props;
  const { name, securityData } = network;
  const authorizied = propOr(false, 'authorized', securityData);
  const enabled = propOr(false, 'enabled', securityData);


  // comiing soon
  // const enabled = propOr(false, 'enabled', securityData);

  const statusGlyph = authorizied ?
    'glyphicon-transfer text-success' : 'glyphicon-exclamation-sign text-danger';

  return (
    <div className='flex-row jc-sb fs-xs'>
      <div className='w-min-300 fs-md'>{name}</div>
      <div className='cur-ptr fs-sm' onClick={onToggleEnabled}>
        <input className='xbox-small' type="checkbox" checked={enabled} onChange={noop}/>
        Enabled
      </div>
      <div className={`glyphicon fs-md ${statusGlyph}`} />
      <div
        className="glyphicon glyphicon-pencil fs-md mrg-r-20 cur-ptr"
        onClick={onEdit}
      />
    </div>
  );
}
