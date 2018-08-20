import React, {Component} from "react";
import PT from 'prop-types';
import { propOr } from 'ramda';
import { withRouter } from 'react-router-dom';
import { dispatchError } from '../../../utils/errorUtils';
import networkStore from "../../../stores/NetworkStore";
import NetworkView from '../views/NetworkView';

//******************************************************************************
// The interface
//******************************************************************************

const propTypes = {
  network: PT.object.isRequired,
  networkProtocolName: PT.string, // protocol for this network
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
    const { network={} } = this.props;
    this.setState({network});
  }

  onToggleEnabled() {
    const network = propOr({}, 'network', this.state);
    const securityData = propOr({}, 'securityData', network);
    const currentlyEnabled = propOr(false, 'enabled', securityData);

    const securityDataModifications = {
       ...securityData,
       enabled: !currentlyEnabled
    };
    const networkModifications = {...network, securityData: securityDataModifications};

    network && networkStore.updateNetwork(networkModifications)
    .then(udpatedNetwork => this.setState({ network: udpatedNetwork }))
    .catch(e=>dispatchError(e));
  }

  onEdit() {
    const { id } = this.state.network;
    id && this.props.history.push(`/admin/network/${id}`);
  }

  render() {
    return (
      <NetworkView
        network={this.state.network}
        networkProtocolName={this.props.networkProtocolName}
        onToggleEnabled={this.onToggleEnabled}
        onEdit={this.onEdit}
      />
    );
  }
}

export default withRouter(Network);
Network.propTypes = propTypes;
Network.defaultProps = defaultProps;
