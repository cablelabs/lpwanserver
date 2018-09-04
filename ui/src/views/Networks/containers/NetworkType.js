import React from 'react';
import PT from 'prop-types';
import NetworkProtocolView from '../views/NetworkProtocolView';
import networkGroupStore from "../../../stores/NetworkGroupStore";
import flyd from 'flyd'

//******************************************************************************
// NetworkTypeView
//******************************************************************************

export default class NetworkType extends React.Component {
  constructor (props, ...rest) {
    super(props, ...rest)
    this.state = { groups: [] }
  }
  componentDidMount () {
    flyd.on(
      groups => this.setState({ groups }),
      networkGroupStore.groupsByNetworkTypeId(this.props.networkType.id)
    )
  }
  render () {
    const { state, props } = this;
    const mrgTop = props.first ? '' : 'mrg-t-30';
    return (
      <div>
        <div className={`txt-color-alt fs-sm ${mrgTop}`}>
          {props.networkType.name || '?'} Networks
        </div>
        {state.groups.map((x, i) => (
          <NetworkProtocolView networkProtocol={x} key={x.masterProtocol} first={i === 0} />
        ))}
      </div>
    );
  }
}

//******************************************************************************
// Interface
//******************************************************************************

NetworkType.propTypes = {
  networkType: PT.object, // the network type to dislpay
  first: PT.bool
};

NetworkType.defaultProps = {
  networkType: {},
  first: false
};