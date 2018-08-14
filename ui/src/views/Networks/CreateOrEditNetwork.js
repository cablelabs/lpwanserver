import React, {Component} from "react";
import PT from 'prop-types';
import { withRouter } from 'react-router-dom';
import { propOr, pathOr, lensPath, lensProp, append, set, pick, view, merge } from 'ramda';
import qs from 'query-string';
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
import ConfirmationDialog from '../../components/ConfirmationDialog';

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
      oauthSuccessModalOpen: false,
      oauthFailureModalOpen: false,
      oauthErrorMessages: [],
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.gotoListPage = this.gotoListPage.bind(this);
    this.oauthSuccess = this.oauthSuccess.bind(this);
    this.oauthFailure = this.oauthFailure.bind(this);
    this.oauthNotify = this.oauthNotify.bind(this);
    this.oauthSuccessClose = this.oauthSuccessClose.bind(this);
    this.oauthFailureClose = this.oauthFailureClose.bind(this);
    this.oauthNotifyClose = this.oauthNotifyClose.bind(this);
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

      // Add a field to compare the original securityData to any changes when
      // we go to submit - may require a new OAuth call.
      networkData.origSecurityData = networkData.securityData;
      this.setState({
        network, networkTypes, networkProtocols, networkProviders, ...networkData
      });

      // Lets see if we are coming back from an oauth
      const queryParams = qs.parse(pathOr({}, [ 'location', 'search' ],  this.props));
      const oauthStatus = propOr('', 'oauthStatus', queryParams);

      // Are we coming back from an oauth?
      if ( oauthStatus ) {

        const authorized = pathOr(false, ['securityData', 'authorized'], networkData);
        const oauthErrorMessage = propOr('', 'oauthError', queryParams);
        const serverNoauthReason = 'Server was not able to contact network'; // coming soon : pathOr(false, ['securityData', 'message'], networkData);
        const networkProtocolName = getCurrentProtocolName(propOr(-1, 'id', network), networkProtocols);

        if ( oauthStatus === 'success' && authorized ) {
          this.oauthSuccess();
        }

        else if ( oauthStatus === 'success' && !authorized ) {
          this.oauthFailure([
            `Your authorization information was valid, but lpwan server was not able to connect to the ${networkProtocolName} server`,
            serverNoauthReason ]);
        }

        else if ( oauthStatus === 'fail' && !authorized ) {
          this.oauthFailure([
            `Your ${networkProtocolName} authorization information was not valid`,
            oauthErrorMessage ]);
        }

        else if ( oauthStatus === 'fail' && authorized ) {
          this.oauthFailure([
            `Your authorization information seemed to be invalid, but you appear to be authorized`,
            'This is an abnormal state.  It is advised that you reauthorize with this network by re-entering your authorizaion information',
            oauthErrorMessage ]);
        }
      }
    })
    .catch(err => dispatchError(
      `Error retrieving information while trying to ${isNew?'create':'edit'} ` +
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
    const { networkProtocols=[], networkProtocolId, securityData={}, origSecurityData={} } = this.state;

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
      const oauthUrl = getCurrentProtocolOauthUrl(networkProtocolId, networkProtocols);
      const authorized =  pathOr(false, ['network', 'securityData', 'authorized'], this.state);
      const securityDataChanged = JSON.stringify(securityData) !== JSON.stringify(origSecurityData);

      // redirect to oauth page if needed
      if (oauthUrl && (!authorized || securityDataChanged)) {
        const protocolMetaData = getCurrentProtocolMetaData(networkProtocolId, networkProtocols);
        const oauthRedirect =  makeOauthRedirectUrl(protocolMetaData, securityData,);
        sessionStore.putSetting('oauthNetworkTarget', networkId);
        sessionStore.putSetting('oauthStartTime', Date.now());
        navigateToExernalUrl(oauthRedirect);
      }
      else {
        this.props.history.push('/admin/networks');
      }
    })

    // the create/edit failed
    .catch( err => {
      // ** JIM **
      // can you finish this.  We may need to check w Dan to see what error codes he is returning
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

  gotoListPage() {
    this.props.history.push('/admin/networks');
  }

  oauthSuccess() {
      this.setState({oauthSuccessModalOpen: true});
  }

  oauthSuccessClose() {
      this.setState({oauthSuccessModalOpen: false});
  }

  oauthFailure(messages) {
        this.setState({oauthFailureModalOpen: true, oauthErrorMessages: messages});
    }

  oauthFailureClose() {
      this.setState({oauthFailureModalOpen: false, oauthFailureReason: ''});
  }

  oauthNotify() {
      this.setState({oauthNotifyModalOpen: true});
  }

  oauthNotifyClose() {
      this.setState({oauthNotifyModalOpen: false});
  }

  setOauthErrorMessages(messages) {
    this.setState({ oauthErrorMessages : messages });
  }

 render() {

    const { networkTypes=[], networkProtocolId, networkProtocols=[], networkProviders=[] } = this.state;
    const { isNew } = this.props;
    const { onChange, onSubmit, onDelete } = this;
    const networkData = pick(networkProps, this.state);
    const networkProtocolName = getCurrentProtocolName(networkProtocolId, networkProtocols);

    return (
      <div>
        <NetworkForm
          {...{ isNew, networkData, networkTypes, networkProtocols, networkProviders }}
          {...{ onChange, onSubmit, onDelete }}
        />

      <ConfirmationDialog
        open={this.state.oauthSuccessModalOpen}
        title='Network Succesfully Created'
        subTitle={`You are authorized with ${networkProtocolName}, and will now be able to add applications and devices`}
        confButtons={[{ label: 'OK', className: 'btn-primary', onClick: this.gotoListPage }]}
      />

      <ConfirmationDialog
        open={this.state.oauthFailureModalOpen}
        title='Authorization Failed'
        subTitle='You may continue editing the network, discard it, or save the information you entered without network authorization'
        text={this.state.oauthErrorMessages||[]}
        confButtons={[
          { label: 'Discard Network', className: 'btn-danger', onClick: this.onDelete, },
          { label: 'Continue Editing', className: 'btn-default', onClick: this.oauthFailureClose, },
          { label: 'Save', className: 'btn-default', onClick: this.gotoListPage, },
        ]}
      />
      </div>
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

function getCurrentProtocolMetaData(networkProtocolId=0, networkProtocols=[] ) {
  const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
  return pathOr({}, [networkProtocolIndex, 'metaData'], networkProtocols);
}

function getCurrentProtocolOauthUrl(networkProtocolId=0, networkProtocols=[] ) {
  const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
  return pathOr('', [networkProtocolIndex, 'metaData', 'oauthUrl'],  networkProtocols);
}

function getCurrentProtocolName(networkProtocolId=0, networkProtocols=[] ) {
  const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
  return pathOr('', [ networkProtocolIndex, 'name', ],  networkProtocols);
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

function makeOauthRedirectUrl(protocolMetaData, securityData) {

  const oauthUrl = propOr('', 'oauthUrl', protocolMetaData);
  if ( !oauthUrl ) return '';

  const thisServer = process.env.REACT_APP_PUBLIC_BASE_URL;
  const frontEndOauthReturnUri = `${thisServer}/admin/networks/oauth`;
  const queryParams = propOr([], 'oauthRequestUrlQueryParams', protocolMetaData);

  // TEMP until added to back end
  const qps = [...queryParams, { name: 'redirect_uri', valueSource: 'frontEndOauthReturnUri' }];

  const queryParamString = qps.reduce((qpStr, qp, i)=>
    `${qpStr}${i>0 ? '&':'?'}${makeQueryParam(qp, securityData, frontEndOauthReturnUri)}`, '');

  return `${oauthUrl}${queryParamString}`;
}


function makeQueryParam(qeuryParamSpec={}, securityData={}, frontEndOauthReturnUri ) {
  const { name, valueSource, value, protocolHandlerNetworkField } = qeuryParamSpec;

  // TODO temp until fixed
  const tempName = name === 'cliend_id' ? 'client_id' : name;

  const queryValue =
    valueSource === 'value' ? value :
    valueSource === 'protocolHandlerNetworkField' ? securityData[protocolHandlerNetworkField] :
    valueSource === 'frontEndOauthReturnUri' ? frontEndOauthReturnUri : 'unknown value source';
  return `${tempName}=${queryValue}`;
}

// pass in falsey networkId skip network fetch
async function fetchNetworkInfo(networkId) {

  const networkTypes = networkTypeStore.getNetworkTypes();
  const networkProtocols = networkProtocolStore.getNetworkProtocols();
  const networkProviders = networkProviderStore.getNetworkProviders();
  const network = networkId ? networkStore.getNetwork(networkId) : Promise.resolve({});

  return {
    networkTypes: await networkTypes,
    networkProtocols: propOr([], 'records', await networkProtocols),
    networkProviders: propOr([], 'records', await networkProviders),
    network: await network,
  };
}
