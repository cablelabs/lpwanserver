import React from 'react';
import PT from 'prop-types';
import { propOr } from 'ramda';
import { noop } from 'ramda-adjunct';
import ReactTooltip from 'react-tooltip';

//******************************************************************************
// Interface
//******************************************************************************

NetworkView.propTypes = {
  network: PT.object, // the network to dislpay
  networkProtocolName: PT.string, // protocol for this network
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

  console.log('props', props);
  const { network={}, networkProtocolName, onToggleEnabled, onEdit } = props;
  const { name, securityData } = network;
  const authorizied = propOr(false, 'authorized', securityData);
  const enabled = propOr(false, 'enabled', securityData);

    const statusGlyph = authorizied ?
    'glyphicon-transfer text-success' : 'glyphicon-exclamation-sign text-danger';

  return (
    <div className='flex-row jc-sb fs-xs'>
      <div className='w-min-300 fs-md'>{name}</div>

      <EnabledToolTip name='enableCheckBox'/>
      <div data-tip data-for='enableCheckBox' className='cur-ptr fs-sm' onClick={onToggleEnabled}>
        <input className='xbox-small' type="checkbox" checked={enabled} onChange={noop}/>
        Enabled
      </div>

      <ConnectedToolTip name='connected' networkProtocolName={networkProtocolName}/>
      <div data-tip data-for='connected' className={`glyphicon fs-md ${statusGlyph}`} />

      <div
        className="glyphicon glyphicon-pencil fs-md mrg-r-20 cur-ptr"
        onClick={onEdit}
      />
    </div>
  );
}


//******************************************************************************
// Sub Components
//******************************************************************************

function EnabledToolTip({name}) {
  return (
    <ReactTooltip id={name} type='info' effect="solid">
      <div className='lh-compress'>
        <div>If unchecked, disables flow of data</div>
        <div>to/from the remote network</div>
      </div>
    </ReactTooltip>
  );
}

function ConnectedToolTip({name, networkProtocolName}) {
  return (
    <ReactTooltip id={name} type='success' effect="solid">
      <div className='lh-compress'>
        <div>This network is connected to the remote</div>
        <div>{`${networkProtocolName?networkProtocolName:'IOT'} network`}</div>
      </div>
    </ReactTooltip>
  );
}

function NotConnectedToolTip({name, type, networkProtocolName}) {
  return (
    <ReactTooltip id={name} type={type} effect="solid">
      <div className='lh-compress'>
        <div>This network is not connected to the remote</div>
        <div className='mrg-b-5'>{`${networkProtocolName?networkProtocolName:'IOT'} network.`}</div>
        <div>You may note be curently authorized,</div>
        <div>or the remote network may not be available</div>
      </div>
    </ReactTooltip>
  );
}
