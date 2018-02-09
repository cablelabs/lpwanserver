import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import networkProviderStore from "../../stores/NetworkProviderStore";
import SessionStore from "../../stores/SessionStore";

class NetworkProviderRow extends Component {
  render() {
    return (
      <tr>
        <td><Link to={`/admin/networkProvider/${this.props.networkProvider.id}`}>{this.props.networkProvider.name}</Link></td>
      </tr>
    );
  }
}

class ListNetworkProviders extends Component {
  constructor() {
    super();

    this.state = {
      networkProviders: [],
      isGlobalAdmin: false,
    };

    this.updatePage = this.updatePage.bind(this);

  }

  componentDidMount() {
    this.updatePage(this.props);

    SessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: SessionStore.isGlobalAdmin(),
      });
    });
  }

  componentWillReceiveProps(nextProps) {

    this.updatePage(nextProps);
  }

  updatePage(props) {
    this.setState({
      isGlobalAdmin: SessionStore.isGlobalAdmin(),
    });

    networkProviderStore.getNetworkProviders()
    .then( networkProviders => {
        this.setState({networkProviders: networkProviders.records});
        window.scrollTo(0, 0);
    });

  }

  render() {
    const NetworkProviderRows = this.state.networkProviders.map((networkProvider) =>
        <NetworkProviderRow key={networkProvider.id}
                            networkProvider={networkProvider} />);

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
            <li><Link to={`/admin/networkProviders`}>Network Providers</Link></li>
        </ol>

        <div className="panel panel-default">



          <div className={`panel-heading clearfix `}>
            Network Providers are the owners of Networks.
            <div className={`btn-group pull-right`}>
              <Link to={`/admin/networkProvider`}>
                <button type="button" className="btn btn-default btn-sm">Create Network Provider</button>
              </Link>
            </div>

          </div>

          <div className={`panel-body clearfix `}>
            <table className="table table-hover">
              <thead>
              <tr>
                <th className="col-md-4">Name</th>
              </tr>
              </thead>
              <tbody>
              {NetworkProviderRows}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    );
  }
}

//
export default ListNetworkProviders;
