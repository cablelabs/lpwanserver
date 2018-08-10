import React, {Component} from "react";
import PT from 'prop-types';
import { withRouter } from 'react-router-dom';
import { propOr, pathOr, lensPath, lensProp, append, set, pick, view, merge } from 'ramda';
import { dispatchError } from '../../utils/errorUtils';
import { viewOr } from 'ramda-adjunct';
import sessionStore from "../../stores/SessionStore";
import networkTypeStore from "../../stores/NetworkTypeStore";
import networkProtocolStore from "../../stores/NetworkProtocolStore";
import networkProviderStore from "../../stores/NetworkProviderStore";
import networkStore from "../../stores/NetworkStore";
import { inputEventToValue, fieldSpecsToValues } from '../../utils/inputUtils';
import { idxById } from '../../utils/objectListUtils';
import { navigateToExernalUrl } from '../../utils/navUtils';
import NetworkForm from '../../components/NetworkForm';

//******************************************************************************
// The interface
//******************************************************************************

const propTypes = {
  isNew: PT.bool,       // are we creating a new network (as opposed to editing existing)
  networkId: PT.string, // ignored if isNew === true
};

const defaultProps = {
  isNew: false,
};

//******************************************************************************
// CreateOrEditNetwork container
//******************************************************************************

const networkProps =
  [ 'id', 'name', 'networkProviderId', 'networkTypeId', 'networkProtocolId', 'baseUrl' , 'securityData' ];

class CreateOrEditNetwork extends Component {

  static contextTypes = {
    router: PT.object.isRequired
  };

  constructor(props, ...rest) {
    super(props, ...rest);

    this.state = {
      name: "",
      networkProviderId: 0,
      networkTypeId: 0,
      networkProtocolId: 0,
      baseUrl: "",
      securityData: {},
      network: {},
      networkTypes: [],
      networkProtocols: [],
      networkProviders: [],
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  componentDidMount() {
    const { isNew, networkId } = this.props;

    fetchNetworkInfo(!isNew && networkId)
    .then(({ networkTypes, networkProtocols, networkProviders, network })=> {

      const defaultIdLens = lensPath([ 0, 'id' ]);
      const protocolLens = lensPath([0, 'metaData', 'protocolHandlerNetworkFields']);

      const networkData = isNew ?
      {
        name: '',
        networkProviderId: view(defaultIdLens, networkProviders),
        networkTypeId: view(defaultIdLens, networkTypes),
        networkProtocolId: view(defaultIdLens, networkProtocols),
        baseUrl: '',
        securityData: fieldSpecsToValues(viewOr({}, protocolLens, networkProtocols)),
      }
      : pick(networkProps, network);

      this.setState({
        network, networkTypes, networkProtocols, networkProviders, ...networkData
      });
    })
    .catch(err => dispatchError(
      `Error retriving information while trying to ${isNew?'create':'edit'} ` +
      `network ${isNew?'':networkId}: ${err}`
    ));
  }

  onChange(path, field, e) {
    const value = inputEventToValue(e);
    const { networkProtocols=[], securityData={} } = this.state;

    let pendingState = this.state;
    if (field === 'networkProtocolId') {
      const securityDefaults = getCurrentSecurityDefaults(value, networkProtocols);
      const securityDataLens = lensProp('securityData');
      pendingState = set(securityDataLens, merge(securityDefaults, securityData), pendingState);
    }

    const fieldLens = lensPath([...path, field]);
    this.setState(set(fieldLens, value, pendingState));
  }

  onSubmit(e) {
    e.preventDefault();

    const { isNew } = this.props;
    const { networkProtocols=[], networkProtocolId, securityData={} } = this.state;

    // only get security fields needed for finally selected protocol
    const securityProps = getCurrentSecurityProps(networkProtocolId, networkProtocols);
    const securityDataToSubmit = pick(securityProps, securityData);

    const mutateMethod = isNew ? 'createNetwork' : 'updateNetwork';
    networkStore[mutateMethod]({
      ...pick(networkProps, this.state),
      securityData: securityDataToSubmit
    })

    .then( newNetworkId => {

      // We get back the networkId on create, but not on update.
      const networkId = isNew ? newNetworkId : pathOr(-1, ['network', 'id'], this.state);
      const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
      // TODO: For determining if we should do OAuth processing:
      // Also check to see if code is NOT there.  If we have a code, we
      // should be OK. (Maybe authTokens OR code).  Implies auth failure on back
      // end should clear these fields.  I think there is an "EmailSiteAdmin"
      // function that should probably be used in this case.
      // SPS: I am thinking that we have createNetwork/updateNetwork return the full object 
      // contiaing the results of the operation, then we can check returnedNetwork.securityData.authorized
      // to see if we can skip OAUTH
      const oauthUrl = pathOr('', [networkProtocolIndex, 'metaData', 'oauthUrl'], networkProtocols);
      if ( oauthUrl) {
        const thisServer = process.env.REACT_APP_PUBLIC_BASE_URL;
        const oauthRedirect =  makeOauthRedirectUrl(thisServer, securityData, oauthUrl);
        sessionStore.putSetting('oauthNetworkTarget', networkId);
        sessionStore.putSetting('oauthStartTime', Date.now());
        navigateToExernalUrl(oauthRedirect);
      }
      else {
        this.props.history.push('/admin/networks');
      }
    });
  }

  onDelete(e) {
    e.preventDefault();
    const { network={} } = this.state;

    //eslint-disable-next-line
    if (network.id && confirm("Are you sure you want to delete this network?")) {
      networkStore.deleteNetwork(network.id ).then( (responseData) => {
        this.props.history.push('/admin/networks');
      })
      .catch( (err) => { alert( "Delete failed:" + err ); } );
    }
  }

  render() {

    const { networkTypes=[], networkProtocols=[], networkProviders=[] } = this.state;
    const { isNew } = this.props;
    const { onChange, onSubmit, onDelete } = this;
    const networkData = pick(networkProps, this.state);

    return (
      <NetworkForm
        {...{ isNew, networkData, networkTypes, networkProtocols, networkProviders }}
        {...{ onChange, onSubmit, onDelete }}
      />
    );
  }
}

export default withRouter(CreateOrEditNetwork);

CreateOrEditNetwork.propTypes = propTypes;
CreateOrEditNetwork.defaultProps = defaultProps;


//******************************************************************************
// Helper Functions
//******************************************************************************

function getCurrentProtocolFields(networkProtocolId=0, networkProtocols=[] ) {
  const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
  return pathOr([],
    [networkProtocolIndex, 'metaData', 'protocolHandlerNetworkFields'], networkProtocols);
}

function getCurrentSecurityProps(networkProtocolId, networkProtocols) {
  const protoFields = getCurrentProtocolFields(networkProtocolId, networkProtocols);
  return protoFields.reduce((propAccum,curField)=>
    curField.name ? append( curField.name, propAccum) : propAccum, []);
}

function getCurrentSecurityDefaults(networkProtocolId, networkProtocols) {
  const protoFields = getCurrentProtocolFields(networkProtocolId, networkProtocols);
  return fieldSpecsToValues(protoFields);
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
}

// pass in networkId of undefined, null, or false to skip network fetch
async function fetchNetworkInfo(networkId) {

  const networkTypes = networkTypeStore.getNetworkTypes();
  const networkProtocols = networkProtocolStore.getNetworkProtocols();
  const networkProviders = networkProviderStore.getNetworkProviders();
  const network = networkId ? networkStore.getNetwork(networkId) : Promise.resolve(null);

  return {
    networkTypes: await networkTypes,
    networkProtocols: propOr([], 'records', await networkProtocols),
    networkProviders: propOr([], 'records', await networkProviders),
    network: await network,
  };
}
