import React, {Component} from "react";
import {Link, withRouter} from 'react-router-dom';

import networkStore from "../../stores/NetworkStore";
import networkTypeStore from "../../stores/NetworkTypeStore";
import networkProtocolStore from "../../stores/NetworkProtocolStore";
import networkProviderStore from "../../stores/NetworkProviderStore";
import PropTypes from 'prop-types';


class CreateNetwork extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
        name: "",
        networkProviderId: 0,
        networkTypeId: 0,
        networkProtocolId: 0,
        baseUrl: "",
        networkTypes: [],
        networkProtocols: [],
        networkProviders: [],
    };


    this.netsecui = {};
    this.netSecUIComponent = null;

    networkTypeStore.getNetworkTypes()
    .then( ( response ) => {
        // Default to first type so the UI matches the default selection.
        this.setState( { networkTypes: response,
                         networkTypeId: response[ 0 ].id } );

        // Set up the network secuity to match.
        this.netsecui = {};
        this.generateSecurityDataUI( true );
        this.netSecUIComponent = null;
    });
    networkProtocolStore.getNetworkProtocols()
    .then( response => this.setState(
                    { networkProtocols: response.records,
                      networkProtocolId: response.records[ 0 ].id} ) );
    networkProviderStore.getNetworkProviders()
    .then( response => this.setState(
                    { networkProviders: response.records,
                      networkProviderId: response.records[ 0 ].id } ) );


    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.generateSecurityDataUI = this.generateSecurityDataUI.bind(this);
    this.addNetSecUIComponent = this.addNetSecUIComponent.bind(this);
  }

  onSubmit(e) {
    e.preventDefault();
    let securityData = {};
    if ( this.netSecUIComponent ) {
        securityData = this.netSecUIComponent.getSecurityData();
    }
    networkStore.createNetwork( this.state.name,
                                this.state.networkProviderId,
                                this.state.networkTypeId,
                                this.state.networkProtocolId,
                                this.state.baseUrl,
                                securityData )
    .then( (responseData) => {
        this.props.history.push('/admin/networks');
    });
  }

  componentWillMount() {

  }

  onChange(field, e) {
      let network = this.state;
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

      this.setState( network );
  }

  addNetSecUIComponent( comp ) {
      this.netSecUIComponent = comp;
  }

  generateSecurityDataUI( resetState ) {
      let types = this.state.networkTypes;
      let typeName = "default";
      for ( var i = 0; i < types.length; ++i ) {
          if ( this.state.networkTypeId === types[ i ].id ) {
              typeName = types[ i ].name;
          }
      }

      import( "../NetworkCustomizations/" + typeName + "/Network.js" )
      .then( ( comp ) => {
          this.netsecui = comp;
          if ( resetState ) {
              this.setState( {} );
          }
      })
      .catch( ( err ) => {
           console.log( "Can't find networkType securityData UI: " + err );
           console.log( "Loading default" );

           import( "../NetworkCustomizations/default/Network.js" )
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
    var NetSecUI;
    if ( this.netsecui.default ) {
        NetSecUI = this.netsecui.default;
    }
    else {
        return ( <div></div> );
    }

    let networkTypeIndex = 0;
    if ( this.state.networkTypes ) {
        for ( let i = 0; i < this.state.networkTypes.length; ++i ) {
            if ( this.state.networkTypes[ i ].id === this.state.networkTypeId ) {
                networkTypeIndex = i;
            }
        }
    }

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/networks`}>Networks</Link></li>
          <li className="active">Create Network</li>
        </ol>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title panel-title-buttons">Create Network</h3>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className="panel-body">
              <div className="form-group">
                <label className="control-label" htmlFor="name">Network Name</label>
                <input className="form-control"
                       id="name"
                       type="text"
                       placeholder="e.g. 'Kyrio LoRa'"
                       required
                       value={this.state.name || ''}
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
                        value={this.state.networkTypeId}
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
                        value={this.state.networkProtocolId}
                        onChange={this.onChange.bind(this, 'networkProtocolId')}>
                  {this.state.networkProtocols.map( nprot => <option value={nprot.id} key={"typeSelector" + nprot.id } disabled={nprot.networkTypeId !== this.state.networkTypeId}>{nprot.name}</option>)}
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
                        value={this.state.networkProviderId}
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
                       required value={this.state.baseUrl || ''}
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
                  securityData="{}" />

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

export default withRouter(CreateNetwork);
