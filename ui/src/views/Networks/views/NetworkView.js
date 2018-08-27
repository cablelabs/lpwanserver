import React from 'react';
import PT from 'prop-types';
import { propOr, isEmpty } from 'ramda';
import { noop } from 'ramda-adjunct';
import ReactTooltip from 'react-tooltip';

//******************************************************************************
// Interface
//******************************************************************************

NetworkView.propTypes = {
  network: PT.object, // the network to dislpay
  networkProtocol: PT.object.isRequired, // protocol for this network
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

  const { network={}, networkProtocol, onToggleEnabled, onEdit } = props;
  const { id='no-id', name, securityData } = network;
  const authorizied = propOr(false, 'authorized', securityData);
  const message = propOr('', 'message', securityData);
  const enabled = propOr(false, 'enabled', securityData);
  const { networkProtocolName } = propOr('', 'name', networkProtocol);

  const ConnectedTooltip = authorizied ? IsConnectedTooltip : IsNotConnectedTooltip;
  const statusGlyph = authorizied ?
    'glyphicon-transfer text-success' : 'glyphicon-exclamation-sign text-danger';

  return (
    <div className='flex-row jc-sb fs-xs'>
      <div className='w-min-300 fs-md'>{name}</div>

      { !isEmpty(network) && <EnabledTooltip name={`enabled-xbox-${id}`} {...{networkProtocolName}}/> }
      <div data-tip data-for={`enabled-xbox-${id}`} className='cur-ptr fs-sm' onClick={onToggleEnabled}>
        <input className='xbox-small' type='checkbox' checked={enabled} onChange={noop}/>
        Enabled
      </div>

      { !isEmpty(network) && <ConnectedTooltip name={`connected-icon-${id}`} {...{networkProtocolName, message}}/> }
      <div data-tip data-for={`connected-icon-${id}`} className={`glyphicon fs-md ${statusGlyph}`} />

      { !isEmpty(network) && <EditToolTip name={`edit-icon-${id}`}/> }
      <div
        data-tip data-for={`edit-icon-${id}`}
        className='glyphicon glyphicon-pencil fs-md mrg-r-20 cur-ptr'
        onClick={onEdit}
      />
    </div>
  );
}


//******************************************************************************
// Sub Components
//******************************************************************************

// array of messages as children, each entry shown on seperate line
function Tooltip({name, type, children, className}) {
  return (
    <ReactTooltip id={name} type={type} effect='solid' className={`lh-compress opaque ${className?className:''}`}>
      { children.map((msg, i)=><div key={i}>{msg}</div>) }
    </ReactTooltip>
  );
}


function EnabledTooltip({name, networkProtocolName}) {
  return (
    <Tooltip name={name} type='info'>
    {[ 'If unchecked, disables flow of data',
        `to/from the remote ${networkProtocolName} network.`
    ]}
    </Tooltip>
  );
}

function IsConnectedTooltip({name, networkProtocolName}) {
  return (
    <Tooltip name={name} type='success'>
    {[ 'Connected to the remote',
       `${networkProtocolName?networkProtocolName:'IOT'} network.`
    ]}
    </Tooltip>
  );
}

function IsNotConnectedTooltip({name, networkProtocolName, message}) {
  return (
    <Tooltip name={name} type='error'>
    {[ `Not connected to the remote ${networkProtocolName?networkProtocolName:'IOT'} network.`,
       'It is likely that you are not authorized.', message
    ]}
    </Tooltip>
  );
}

function EditToolTip({ name }) {
  return (
    <Tooltip name={name} type='info' className='bgc-gry-dark'>
      {[ 'Edit this network.' ]}
    </Tooltip>
  );
}
