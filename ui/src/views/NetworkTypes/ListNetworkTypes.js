import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import networkTypeStore from "../../stores/NetworkTypeStore";
import SessionStore from "../../stores/SessionStore";

class NetworkTypeRow extends Component {
  render() {
    return (
      <tr>
        <td><Link to={`/admin/networkType/${this.props.networkType.id}`}>{this.props.networkType.name}</Link></td>
      </tr>
    );
  }
}

class ListNetworkTypes extends Component {
  constructor() {
    super();

    this.state = {
      networkTypes: [],
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

    networkTypeStore.getNetworkTypes()
    .then( networkTypes => {
        this.setState({networkTypes: networkTypes});
        window.scrollTo(0, 0);
    });

  }

  render() {
    const NetworkTypeRows = this.state.networkTypes.map((networkType) =>
        <NetworkTypeRow key={networkType.id}
                        networkType={networkType} />);

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
            <li><Link to={`/admin/networkTypes`}>Network Types</Link></li>
        </ol>

        <div className="panel panel-default">



          <div className={`panel-heading clearfix `}>
            Network Types define groups of networks that use the same
            data.  This data will be distributed to all networks of
            the type.
            <div className={`btn-group pull-right`}>
              <Link to={`/admin/networkType`}>
                <button type="button" className="btn btn-default btn-sm">Create Network Type</button>
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
              {NetworkTypeRows}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    );
  }
}

//
export default ListNetworkTypes;
