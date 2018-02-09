import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import networkProtocolStore from "../../stores/NetworkProtocolStore";
import SessionStore from "../../stores/SessionStore";

class NetworkProtocolRow extends Component {
  render() {
    return (
      <tr>
        <td><Link to={`/admin/networkProtocol/${this.props.networkProtocol.id}`}>{this.props.networkProtocol.name}</Link></td>
      </tr>
    );
  }
}

class ListNetworkProtocols extends Component {
  constructor() {
    super();

    this.state = {
      networkProtocols: [],
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

    networkProtocolStore.getNetworkProtocols()
    .then( networkProtocols => {
        this.setState({networkProtocols: networkProtocols.records});
        window.scrollTo(0, 0);
    });

  }

  render() {
    const NetworkProtocolRows = this.state.networkProtocols.map((networkProtocol) =>
        <NetworkProtocolRow key={networkProtocol.id}
                            networkProtocol={networkProtocol} />);

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
            <li><Link to={`/admin/networkProtocols`}>Network Protocols</Link></li>
        </ol>

        <div className="panel panel-default">



          <div className={`panel-heading clearfix `}>
            Network Protocols define the way we communicate with the remote network.<br/>
            <strong>Changes here MUST be coordinated with code changes on the REST Server.</strong>
            <div className={`btn-group pull-right`}>
              <Link to={`/admin/networkProtocol`}>
                <button type="button" className="btn btn-default btn-sm">Create Network Protocol</button>
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
              {NetworkProtocolRows}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    );
  }
}

//
export default ListNetworkProtocols;
