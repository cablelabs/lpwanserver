import React, {Component} from 'react';


import SessionStore from "../stores/SessionStore";
import networkProtocolStore from "../stores/NetworkProtocolStore";
import networkTypeStore from "../stores/NetworkTypeStore";
import '../index.css';
import {withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';


class NetworkProtocolForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
        networkProtocol: props.networkProtocol,
        networkTypes: [],
        networkProtocolHandlers: [],
        isGlobalAdmin: SessionStore.isAdmin(),
    };

    networkTypeStore.getNetworkTypes()
    .then( response => this.setState( { networkTypes: response } ) )
    .catch( err =>  this.props.history.push('/admin/networkProtocols') );

    networkProtocolStore.getNetworkProtocolHandlers()
      .then((response) => {
        //Add a none selected place holder
        let temp = [{id: '', name: 'No Handler Selected'}];
        temp = temp.concat(response);
        this.setState({
          networkProtocolHandlers: temp,
        });
      });

    this.componentWillMount = this.componentWillMount.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  componentWillMount() {
    SessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: SessionStore.isAdmin(),
      });
    });
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

  onDelete(e) {
      e.preventDefault();
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this network type?")) {
      networkProtocolStore.deleteNetworkProtocol(this.state.networkProtocol.id ).then( (responseData) => {
        this.props.history.push('/admin/networkProtocols');
      })
      .catch( (err) => { alert( "Delete failed:" + err ); } );
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state.networkProtocol);
  }



  render() {
    if ( !this.state.networkProtocol ||
         !this.state.networkProtocol.id ) {
        return ( <div></div> );
    }

    return (

      <div>
        <div className="btn-group pull-right">
            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Network Protocol
              </button>
            </div>
        </div>

        <hr/>
        <form onSubmit={this.handleSubmit}>
          <div>
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
                the communication with the servers that use this potocol.
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
    );
  }
}

export default withRouter(NetworkProtocolForm);
