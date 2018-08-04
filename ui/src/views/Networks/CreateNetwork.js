import React, {Component} from "react";
import PropTypes from 'prop-types';
import {Link, withRouter} from 'react-router-dom';
import { pathOr, lensPath, lensProp, set as lensSet } from 'ramda';
import networkStore from "../../stores/NetworkStore";
import networkTypeStore from "../../stores/NetworkTypeStore";
import networkProtocolStore from "../../stores/NetworkProtocolStore";
import networkProviderStore from "../../stores/NetworkProviderStore";
import DynamicForm from '../../components/DynamicForm';
import { inputEventToValue, fieldSpecsToValues } from '../../utils/inputUtils';
import { idxById } from '../../utils/objectListUtils';
import { navigateToExernalUrl } from '../../utils/navUtils';
import sessionStore from "../../stores/SessionStore";

//******************************************************************************
// The component
//******************************************************************************

class CreateNetwork extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props, ...rest) {
    super(props, ...rest);
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

    networkTypeStore.getNetworkTypes()
    .then( response => {
        // default to first type in the list
        this.setState({
            networkTypes: response,
            networkTypeId: response[ 0 ].id
        });
    });

    networkProtocolStore.getNetworkProtocols()
    .then( ({records}) => this.setState({
        // default to first protocol in the list
        networkProtocols: records,
        networkProtocolId: records[ 0 ].id,
        securityData: fieldSpecsToValues(
          pathOr({}, [0, 'metaData', 'protocolHandlerNetworkFields'], records))
      })
    );

    networkProviderStore.getNetworkProviders()
    .then( ({records}) => this.setState({
        // default to first provider in the list
        networkProviders: records,
        networkProviderId: records[ 0 ].id
      })
    );

    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onSubmit(e) {
    const { networkProtocols=[], networkProtocolId, securityData={} } = this.state;

    e.preventDefault();
    networkStore.createNetwork( this.state.name,
                                this.state.networkProviderId,
                                this.state.networkTypeId,
                                this.state.networkProtocolId,
                                this.state.baseUrl,
                                this.state.securityData )
    .then( newNetworkId => {
      const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
      const oauthUrl = pathOr('', [networkProtocolIndex, 'metaData', 'oauthUrl'], networkProtocols);
      if ( oauthUrl) {
        const thisServer = process.env.REACT_APP_PUBLIC_BASE_URL;
        const oauthRedirect =  makeOauthRedirectUrl(thisServer, securityData, oauthUrl);
        sessionStore.putSetting('oauthNetworkTarget', newNetworkId);
        sessionStore.putSetting('oauthStartTime', Date.now());
        navigateToExernalUrl(oauthRedirect);
        // this.props.history.push('/admin/networks');
      }
      else {
        this.props.history.push('/admin/networks');
      }
    });
  }

  onChange(path, field, e) {
      const { networkProtocols=[], networkProtocolId } = this.state;
      const value = inputEventToValue(e);
      let newState = this.state;

      if ( field === 'networkProtocolId' && value !== networkProtocolId ) {
        const securityDataLens = lensProp('securityData');
        const securityValues = fieldSpecsToValues(currentProtocolFields(value, networkProtocols));
        newState = lensSet(securityDataLens, securityValues, newState);
      }

      const fieldLens = lensPath([...path, field]);
      newState = lensSet(fieldLens, value, newState);
      this.setState(newState);
  }

  render() {

    // console.log('this.state', this.state);

    const { networkProtocols=[], networkProtocolId, securityData={} } = this.state;
    const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
    const protocolFields = currentProtocolFields(networkProtocolId, networkProtocols);

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
                       onChange={this.onChange.bind(this, [], 'name')}/>
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
                        onChange={this.onChange.bind(this, [], 'networkTypeId')}>
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
                        onChange={this.onChange.bind(this, [], 'networkProtocolId')}>
                  {networkProtocols.map( nprot =>
                    <option
                      value={nprot.id}
                      key={"typeSelector" + nprot.id }
                      disabled={nprot.networkTypeId !== this.state.networkTypeId}>{nprot.name}</option>)}
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
                        onChange={this.onChange.bind(this, [], 'networkProviderId')}>
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
                       onChange={this.onChange.bind(this, [], 'baseUrl')}/>
                <p className="help-block">
                  The base API address that the network protocol uses to access
                  and update data on this network.  The network protocol may
                  append additional URL data to this path to access various
                  services as defined by the protocol.
                </p>
              </div>
              { protocolFields &&
                <div className="form-section-margin-top">
                  <strong>
                      { `${pathOr('', [networkProtocolIndex, 'name'], networkProtocols)} ` }
                      network specific data
                  </strong>
                  <DynamicForm
                    fieldSpecs={protocolFields}
                    fieldValues={securityData}
                    onFieldChange={this.onChange}
                    path={['securityData']}
                    key={networkProtocolIndex}
                  />
                </div>
              }
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

//******************************************************************************
// Helper Functions
//******************************************************************************

function currentProtocolFields(networkProtocolId=0, networkProtocols=[] ) {
  const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
  return pathOr([],
    [networkProtocolIndex, 'metaData', 'protocolHandlerNetworkFields'], networkProtocols);
}

function makeOauthRedirectUrl(thisServer, securityData, oauthUrl) {

  // TODO: get this from proto metadata eventually
  const queryParams = [
    { name: 'client_id', value: securityData.clientId },
    { name: 'response_type', value: 'code' },
  ];

  // TODO: make returnPath config param?
  const returnPath = 'admin/networks/oauth';
  const redirectParam = { name: 'redirect_uri', value: `${thisServer}/${returnPath}` };
  return ([...queryParams, redirectParam]).reduce((urlAccum, curParam, i) =>
    `${urlAccum}${i>0 ? '&':'?'}${curParam.name}=${curParam.value}`,`${oauthUrl}`);

  // NOTE: for error stuff
  // ?error=invalid_request&error_description=Wrong%20RedirectUri%20provided"

}
