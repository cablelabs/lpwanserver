import React from 'react';
import PT from 'prop-types';
import networkStore from "../../stores/NetworkStore";
import { isFunction } from 'ramda-adjunct';

//******************************************************************************
// Interface
//******************************************************************************

// this is a render prop component
const propTypes = {
  networkId: PT.string, // ID of network to fetch
  render: PT.func        // function to call with network data, sig::render(network)
};

//******************************************************************************
// Component
//******************************************************************************

export default class FetchNetwork extends React.Component {

  constructor(props, ...rest) {
    super(props, ...rest);
    this.state = { network: null };
  }

  componentDidMount() {
    const { networkId } = this.props;
    networkId && networkStore.getNetwork(networkId).then(
      network => this.setState({network}));
  }

  render = () =>
    <div>
      { isFunction(this.props.render) && this.props.render(this.state.network) }
    </div>

}

FetchNetwork.propTypes = propTypes;
