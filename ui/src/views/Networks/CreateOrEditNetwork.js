import React from 'react';
import { withRouter } from 'react-router-dom';
import { path, propOr, compose } from 'ramda';
import BreadCrumbs from '../../components/BreadCrumbs';
import NetworkCreateOrEdit from './containers/NetworkCreateOrEdit';
import networkStore from "../../stores/NetworkStore";
import networkProtocolStore from '../../stores/NetworkProtocolStore'
import connect from '../../utils/connectStore'
import { dispatchError, errorToText } from '../../utils/errorUtils';

const getNetworkId = path([ 'match', 'params', 'networkID' ])

class CreateOrEditNetowrk extends React.Component {
  componentDidMount () {
    const id = getNetworkId(this.props)
    const requests = [networkProtocolStore.getNetworkProtocols()]
    // if (id && !this.props.network) requests.push(networkStore.getNetwork(id))
    return Promise.all(requests)
      .catch(err => dispatchError(
        `Error retrieving information while trying to ${!id ? 'create' : 'edit'} ` +
        `network ${id || ''}: ${errorToText(err)}`
      ))
  }
  render () {
    // See if we are dealing with an existing network or not
    const networkId = getNetworkId(this.props)
    const isNew = !networkId;
    const { network, networkProtocols } = this.props

    const breadCrumbs = [
      { to: `/`, text: 'Home' },
      { to: `/admin/networks`, text: 'Networks' },
    ];

    return (
      <div className="panel-body">
        <BreadCrumbs
          trail={breadCrumbs}
          destination={ isNew ? 'CreateNetwork' : propOr('?', 'name', network) }
        />
        {(isNew || network) && networkProtocols.length &&
        <NetworkCreateOrEdit {...{ isNew, networkId, network, networkProtocols }} />}
      </div>
    );
  }
}

export default compose(
  withRouter,
  connect({
    state: {
      network: {
        stream: props => networkStore.networks.findOne(getNetworkId(props))
      },
      networkProtocols: {
        stream: () => networkProtocolStore.protocols.getAll()
      }
    }
  })
)(CreateOrEditNetowrk);
