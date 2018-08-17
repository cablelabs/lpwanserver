import React, {Component} from "react";
import PT from 'prop-types';
import { withRouter } from 'react-router-dom';
import NetworkView from '../views/NetworkView';

//******************************************************************************
// The interface
//******************************************************************************

const propTypes = {
  network: PT.object.isRequired
};

const defaultProps = {
};

//******************************************************************************
// The Container
//******************************************************************************

class NetworkContainer extends Component {

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
    console.log('~~> onToggleEnabled()');
    // networkStore.getNetwork(this.props.networkId)
    // .then( network => this.setState({network}))
    // .catch(dispatchError);

  }

  onEdit() {
    const { id } = this.state.network;
    id && this.props.history.push(`/admin/network/${id}`);
  }

  render() {
    return (
      <NetworkView
        network={this.state.network}
        onToggleEnabled={this.onToggleEnabled}
        onEdit={this.onEdit}
      />
    );
  }
}

export default withRouter(NetworkContainer);
NetworkContainer.propTypes = propTypes;
NetworkContainer.defaultProps = defaultProps;
