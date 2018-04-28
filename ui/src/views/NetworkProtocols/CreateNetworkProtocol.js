import React, {Component} from "react";
import {Link, withRouter} from 'react-router-dom';

import networkProtocolStore from "../../stores/NetworkProtocolStore";
import networkTypeStore from "../../stores/NetworkTypeStore";
import PropTypes from 'prop-types';


class CreateNetworkProtocol extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      networkProtocol: {
          name: "",
          protocolHandler: "",
          networkTypeId: 0,
      },
      networkTypes: [],
      networkProtocolHandlers: []
    };

    networkTypeStore.getNetworkTypes()
    .then( ( response ) => {
        var np = this.state.networkProtocol;
        np.networkTypeId = response[ 0 ].id;
        this.setState( {
                            networkProtocol: np,
                            networkTypes: response,
                       } );
     });

    networkProtocolStore.getNetworkProtocolHandlers()
      .then((response) => {
        //Add a none selected place holder
        let temp = [{id: '', name: 'No Handler Selected'}];
        temp = temp.concat(response);
          this.setState({
            networkProtocolHandlers: temp,
          });
      });



    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(e) {
    e.preventDefault();
    networkProtocolStore.createNetworkProtocol(
                                    this.state.networkProtocol.name,
                                    this.state.networkProtocol.protocolHandler,
                                    this.state.networkProtocol.networkTypeId )
    .then( (responseData) => {
      this.props.history.push('/admin/networkProtocols');
    })
    .catch( err => {
        console.log( "Create NetworkProtocol failed:", err );
    });
  }

  componentWillMount() {

  }

  onChange(field, e) {
    let networkProtocol = this.state.networkProtocol;
    if (field === 'protocolHandler') {
      networkProtocol[field] = e.target.value;
    }
    else if ( (e.target.type === "number") || (e.target.type === "select-one") ) {
      networkProtocol[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      networkProtocol[field] = e.target.checked;
    } else {
      networkProtocol[field] = e.target.value;
    }
    this.setState({networkProtocol: networkProtocol});
  }

  render() {
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/networkProtocols`}>Network Protocols</Link></li>
          <li className="active">Create Network Protocol</li>
        </ol>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title panel-title-buttons">Create Network Protocol</h3>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className="panel-body">
            <div className="form-group">
              <label className="control-label" htmlFor="name">Network Protocol Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     placeholder="e.g. 'LoRa Open Source'"
                     required
                     value={this.state.networkProtocol.name || ''}
                     onChange={this.onChange.bind(this, 'name')}/>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="protocolHandler">Network Protocol Handler</label>
              <select className="form-control"
                     id="protocolHandler"
                      required
                      value={this.state.networkProtocol.protocolHandler}
                      onChange={this.onChange.bind(this, 'protocolHandler')}>
              {this.state.networkProtocolHandlers.map( protocol => <option value={protocol.id} key={"typeSelector" + protocol.id }>{protocol.name}</option>)}
              </select>
              <p className="help-block">
                Specifies the name of the file on the REST Server that handles
                the communication with the servers that use this protocol.
              </p>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="networkTypeId">Network Type</label>
              <select className="form-control"
                      id="networkTypeId"
                      required
                      value={this.state.networkProtocol.networkTypeId}
                      onChange={this.onChange.bind(this, 'networkTypeId')}>
                {this.state.networkTypes.map( nt => <option value={nt.id} key={"typeSelector" + nt.id }>{nt.name}</option>)}
              </select>
              <p className="help-block">
                Specifies the Network Type that defines the data that the
                protocol handler code expects to receive.
              </p>
            </div>

              <div className="btn-toolbar pull-right">
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </div>
          </form>

        </div>
      </div>
    );
  }
}

export default withRouter(CreateNetworkProtocol);
