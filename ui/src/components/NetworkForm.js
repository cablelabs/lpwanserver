import React, {Component} from 'react';


import networkStore from "../stores/NetworkStore";
import networkTypeStore from "../stores/NetworkTypeStore";
import networkProtocolStore from "../stores/NetworkProtocolStore";
import networkProviderStore from "../stores/NetworkProviderStore";
import '../index.css';
import {withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';


class NetworkForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
        network: props.network,
        networkTypes: [],
        networkProtocols: [],
        networkProviders: [],
    };

    if ( !this.state.network.securityData ) {
        let network = this.state.network;
        network.securityData = {};
        this.setState( { network: network } );
    }

    this.netsecui = {};
    this.netSecUIComponent = null;

    networkTypeStore.getNetworkTypes()
    .then( ( response ) => {
        // Default to first type so the UI matches the default selection.
        this.setState( { networkTypes: response, networkTypeId: response[ 0 ].id } );

        // Set up the network secuity to match.
        this.netsecui = {};
        this.generateSecurityDataUI( true );
        this.netSecUIComponent = null;
    });
    networkProtocolStore.getNetworkProtocols()
    .then( response => this.setState( { networkProtocols: response.records } ) );
    networkProviderStore.getNetworkProviders()
    .then( response => this.setState( { networkProviders: response.records } ) );

    this.handleSubmit = this.handleSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.generateSecurityDataUI = this.generateSecurityDataUI.bind(this);
    this.addNetSecUIComponent = this.addNetSecUIComponent.bind(this);
  }

  onChange(field, e) {
      let network = this.state.network;
      if ( (e.target.type === "number") || (e.target.type === "select-one") ) {
        network[field] = parseInt(e.target.value, 10);
      } else if (e.target.type === "checkbox") {
        network[field] = e.target.checked;
      } else {
        network[field] = e.target.value;
      }

      if ( field === "networkTypeId" ) {
        this.generateSecurityDataUI( true );
      }

      this.setState( { network: network } );
  }

  onDelete(e) {
      e.preventDefault();
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this network?")) {
      networkStore.deleteNetwork(this.state.network.id ).then( (responseData) => {
        this.props.history.push('/admin/networks');
      })
      .catch( (err) => { alert( "Delete failed:" + err ); } );
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    if ( this.netSecUIComponent ) {
        let network = this.state.network;
        network.securityData = this.netSecUIComponent.getSecurityData();
        this.setState( { network: network } );
    }
    this.props.onSubmit(this.state.network);
  }

  addNetSecUIComponent( comp ) {
      this.netSecUIComponent = comp;
  }

  generateSecurityDataUI( resetState ) {
      let types = this.state.networkTypes;
      let typeName = "default";
      for ( var i = 0; i < types.length; ++i ) {
          if ( this.state.network.networkTypeId === types[ i ].id ) {
              typeName = types[ i ].name;
          }
      }

      import( "../views/NetworkCustomizations/" + typeName + "/Network.js" )
      .then( ( comp ) => {
          this.netsecui = comp;
          if ( resetState ) {
              this.setState( {} );
          }
      })
      .catch( ( err ) => {
           console.log( "Can't find networkType securityData UI: " + err );
           console.log( "Loading default" );

           import( "../views/NetworkCustomizations/default/Network.js" )
           .then( ( comp ) => {
               this.netsecui = comp;
               if ( resetState ) {
                   this.setState( {} );
               }
           })
           .catch( ( err ) => {
                console.log( "Can't find networkType securityData UI", err );
           });

      });

  }



  render() {
    if ( !this.state.network ||
         !this.state.network.id ||
         !this.netsecui.default ) {
        return ( <div></div> );
    }

    var NetSecUI = this.netsecui.default;

    let networkTypeIndex = 0;
    if ( this.state.networkTypes ) {
        for ( let i = 0; i < this.state.networkTypes.length; ++i ) {
            if ( this.state.networkTypes[ i ].id === this.state.network.networkTypeId ) {
                networkTypeIndex = i;
            }
        }
    }

    return (

      <div>
        <div className="btn-group pull-right">
            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Network
              </button>
            </div>
        </div>

        <hr/>
        <form onSubmit={this.handleSubmit}>
          <div className="panel-body">
            <div className="form-group">
              <label className="control-label" htmlFor="name">Network Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     placeholder="e.g. 'Kyrio LoRa'"
                     required
                     value={this.state.network.name || ''}
                     onChange={this.onChange.bind(this, 'name')}/>
              <p className="help-block">
                The name of the remote IoT network.
              </p>
            </div>

            <div className="form-group">
              <label className="control-label" htmlFor="networkTypeId">Network Type</label>
              <select className="form-control"
                      id="networkTypeId"
                      required
                      value={this.state.network.networkTypeId}
                      onChange={this.onChange.bind(this, 'networkTypeId')}>
                {this.state.networkTypes.map( nt => <option value={nt.id} key={"typeSelector" + nt.id }>{nt.name}</option>)}
              </select>
              <p className="help-block">
                Specifies the Network Type that defines the data that the
                protocol handler code expects to receive.
              </p>
            </div>

            <div className="form-group">
              <label className="control-label" htmlFor="networkProtocolId">Network Protocol</label>
              <select className="form-control"
                      id="networkProtocolId"
                      required
                      value={this.state.network.networkProtocolId}
                      onChange={this.onChange.bind(this, 'networkProtocolId')}>
                {this.state.networkProtocols.map( nprot => <option value={nprot.id} key={"typeSelector" + nprot.id } disabled={nprot.networkTypeId !== this.state.network.networkTypeId}>{nprot.name}</option>)}
              </select>
              <p className="help-block">
                Specifies the Network Protocol that this application will use
                to communicate with the remote network.  The selections here
                are limited by the choice of the network type above.
              </p>
            </div>

            <div className="form-group">
              <label className="control-label" htmlFor="networkProviderId">Network Provider</label>
              <select className="form-control"
                      id="networkProviderId"
                      required
                      value={this.state.network.networkProviderId}
                      onChange={this.onChange.bind(this, 'networkProviderId')}>
                {this.state.networkProviders.map( nprov => <option value={nprov.id} key={"typeSelector" + nprov.id }>{nprov.name}</option>)}
              </select>
              <p className="help-block">
                Specifies the Network Provider that is responsible for the
                IoT network.  This is for informational purposes only.
              </p>
            </div>

            <div className="form-group">
              <label className="control-label" htmlFor="baseUrl">Network Base URL</label>
              <input className="form-control"
                     id="baseUrl"
                     type="text"
                     placeholder="e.g. 'https://myapp.com:12345/delivery/'"
                     required value={this.state.network.baseUrl || ''}
                     onChange={this.onChange.bind(this, 'baseUrl')}/>
              <p className="help-block">
                The base API address that the network protocol uses to access
                and update data on this network.  The network protocol may
                append additional URL data to this path to access various
                services as defined by the protocol.
              </p>
            </div>

            <strong>
                Network-specific data for this&ensp;
                { this.state.networkTypes[ networkTypeIndex ].name }
                &ensp;network
            </strong>
            <NetSecUI
                ref={
                    (thisComponent) => {
                        this.addNetSecUIComponent( thisComponent ); } }
                securityData={this.state.network.securityData} />

            <div className="btn-toolbar pull-right">
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default withRouter(NetworkForm);
