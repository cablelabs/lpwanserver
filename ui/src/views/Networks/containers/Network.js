import React, {Component} from "react";
import PT from 'prop-types';
import { assocPath, pathOr } from 'ramda';
import { withRouter } from 'react-router-dom';
import { dispatchError } from '../../../utils/errorUtils';
import networkStore from "../../../stores/NetworkStore";
import NetworkView from '../views/NetworkView';

//******************************************************************************
// The interface
//******************************************************************************

const propTypes = {
  network: PT.object.isRequired,
  networkProtocol: PT.object.isRequired, // protocol for this network
};

const defaultProps = {
};

//******************************************************************************
// The Container
//******************************************************************************

class Network extends Component {

  static contextTypes = {
    router: PT.object.isRequired
  };

  constructor(props, ...rest) {
    super(props, ...rest);
    this.state = { network : {} };
    this.onToggleEnabled = this.onToggleEnabled.bind(this);
    this.onEdit = this.onEdit.bind(this);
  }

  componentDidMount() {
    this.setState({ network: this.props.network || {} });
  }

  onToggleEnabled() {
    const enabledPath = ['securityData', 'enabled']
    const network = assocPath(
      enabledPath,
      !pathOr(false, enabledPath, this.state.network),
      this.state.network
    )
    networkStore.updateNetwork(network)
      .then(x => this.setState({ network: x }))
      .catch(e=>dispatchError(e));
  }

  onEdit() {
    const { id } = this.state.network;
    id && this.props.history.push(`/admin/network/${id}`);
  }

  render() {
    const { network } = this.state;
    const { networkProtocol } = this.props;
    const { onEdit, onToggleEnabled } = this;
    return (
      <NetworkView {...{ network, networkProtocol, onEdit, onToggleEnabled }}/>
    );
  }
}

export default withRouter(Network);
Network.propTypes = propTypes;
Network.defaultProps = defaultProps;
