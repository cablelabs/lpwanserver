import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import networkStore from "../../stores/NetworkStore";
import SessionStore from "../../stores/SessionStore";

class NetworkRow extends Component {
  render() {
    return (
        <tr>
            <td><Link to={`/admin/network/${this.props.network.id}`}>{this.props.network.name}</Link></td>
            <td>
                <div className={`btn-group pull-right`}>
                    <Link to={`/admin/pull/${this.props.network.id}`}>
                        <button type="button" className="btn btn-default btn-sm">Import From Network</button>
                    </Link>
                </div>
            </td>
        </tr>
    );
  }
}

class ListNetworks extends Component {
  constructor() {
    super();

    this.state = {
      networks: [],
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

    networkStore.getNetworks()
    .then( networks => {
        console.log( networks );
        this.setState({networks: networks.records});
        window.scrollTo(0, 0);
    });

  }

  render() {
    const NetworkRows = this.state.networks.map((network) =>
        <NetworkRow key={network.id}
                        network={network} />);

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
            <li><Link to={`/admin/networks`}>Networks</Link></li>
        </ol>

        <div className="panel panel-default">



          <div className={`panel-heading clearfix `}>
            Networks are the remote IoT networks that this app connects to in
            order to manage applications and devices.
            <div className={`btn-group pull-right`}>
              <Link to={`/admin/network`}>
                <button type="button" className="btn btn-default btn-sm">Create Network</button>
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
              {NetworkRows}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    );
  }
}

//
export default ListNetworks;
