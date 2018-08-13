import React, {Component} from "react";
import PT from 'prop-types';
import { withRouter } from 'react-router-dom';
import Modal from 'react-responsive-modal';
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
      oauthNotifyModalOpen: false,
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
    this.redirectForOauth = this.redirectForOauth.bind(this);
    this.saveNetwork = this.saveNetwork.bind(this);
  }

  componentDidMount() {
    const { isNew, networkId } = this.props;
    fetchNetworkInfo(!isNew && networkId)
    .then(({ networkTypes, networkProtocols, networkProviders, network })=> {
      const defaultIdLens = lensPath([ 0, 'id' ]);
      const protocolLens = lensPath([0, 'metaData', 'protocolHandlerNetworkFields']);

      console.log( "1" );

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

    console.log( "2", network );
      this.setState({
        network, networkTypes, networkProtocols, networkProviders, ...networkData
      });

      console.log( "3" );
      // May want a popup stating we authorized...or not.
      let queryParams = qs.parse(pathOr('', [ 'location', 'search' ],  this.props));
      if (queryParams.oauthStatus) {
          if (queryParams.oauthStatus === "success") {
              console.log("good status");
              const networkData = pick(networkProps, this.state);
              if (networkData.authorized) {
                  console.log("Good auth");
                  this.oauthSuccess();
              }
              else {
                  console.log("Why success but no good auth?");
                  this.oauthSuccess();
              }
          }
          else if (queryParams.oauthStatus === "fail") {
              console.log("OAuth error");
              this.oauthFailure(queryParams.oauthError);
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
    const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);

    // Let's determine if we'll do an oauth sequence before we save.  If so,
    // we show the popup giving the user the chance to bail before we save
    // or update.
    // We need a couple of things to determine if we will oauth:
    // 1) An oauth URL, AND
    // 2) Either of:
    //    a) A change of the securityData fields.
    //    b) A missing authorized flag in the securityData. (This would be
    //       removed by the back end if an unrecoverable auth failure occurs.)
    const oauthUrl = pathOr('', [networkProtocolIndex, 'metaData', 'oauthUrl'], networkProtocols);
    if (oauthUrl) {
        let doOauth = false;
        const authorized =  pathOr(false, ['network', 'securityData', 'authorized'], this.state);
        if (!authorized) {
            doOauth = true;
        }
        else {
            // Data says we're authorized.  But did the user change any
            // securityData?
            if (JSON.stringify(securityData) !== JSON.stringify(origSecurityData)) {
                doOauth = true;
            }
        }

        // Doing Oauth?  Warn the user.  Callback does the save and oauth.
        if (doOauth) {
            this.oauthNotify();
            return;
        }
    }

    // No OAuth, just save.
    this.saveNetwork()
    .then(() => {
        this.props.history.push('/admin/networks');
    })
    .catch(err => dispatchError(
      `Error while trying to ${isNew?'create':'edit'} ` +
      `network ${isNew?'':this.state.network.id}: ${err}`
    ));
  }

  saveNetwork() {
    let me = this;
    return new Promise( function( resolve, reject ) {
      console.log( "Save entry", this );
      const { isNew } = me.props;
      const { networkProtocols=[], networkProtocolId, securityData={} } = me.state;

      // only get security fields needed for finally selected protocol
      const securityProps = getCurrentSecurityProps(networkProtocolId, networkProtocols);
      const securityDataToSubmit = pick(securityProps, securityData);

        console.log( "Save about to happen" );
      const mutateMethod = isNew ? 'createNetwork' : 'updateNetwork';
      networkStore[mutateMethod]({
        ...pick(networkProps, me.state),
        securityData: securityDataToSubmit
      })
      .then((newNetworkId) => {resolve(newNetworkId)})
      .catch((err) => {reject(err)});
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

  oauthFailure(reason) {
      this.setState({oauthFailureModalOpen: true, oauthFailureReason: reason});
  }

  oauthFailureClose() {
      this.setState({oauthFailureModalOpen: false, oauthFailureReason: ''});
  }

  oauthNotify() {
      this.setState({oauthNotifyModalOpen: true});
  }

  redirectForOauth() {
      this.oauthNotifyClose();

      const { isNew } = this.props;
      const { networkProtocols=[], networkProtocolId, securityData={} } = this.state;
      const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
      const oauthUrl = pathOr('', [networkProtocolIndex, 'metaData', 'oauthUrl'],  networkProtocols);

      // Save the network.
      this.saveNetwork()
      .then( newNetworkId => {
        // We get back the networkId on create, but not on update.
        const networkId = isNew ? newNetworkId : pathOr(-1, ['network', 'id'], this.state);

        // At this point, we know we're doing OAuth since this is the function
        // called when the user OK's handling it.  Make it so.
        const thisServer = process.env.REACT_APP_PUBLIC_BASE_URL;
        const oauthRedirect =  makeOauthRedirectUrl(thisServer, securityData, oauthUrl);
        sessionStore.putSetting('oauthNetworkTarget', networkId);
        sessionStore.putSetting('oauthStartTime', Date.now());
        navigateToExernalUrl(oauthRedirect);
      })
      .catch(err => dispatchError(
        `Error while trying to ${isNew?'create':'edit'} ` +
        `network ${isNew?'':this.state.network.id}: ${err}`
      ));
  }

  oauthNotifyClose() {
      this.setState({oauthNotifyModalOpen: false});
  }

 render() {

    const { networkTypes=[], networkProtocols=[], networkProviders=[] } = this.state;
    const { isNew } = this.props;
    const { onChange, onSubmit, onDelete } = this;
    const networkData = pick(networkProps, this.state);


    return (
      <div>
        <NetworkForm
          {...{ isNew, networkData, networkTypes, networkProtocols, networkProviders }}
          {...{ onChange, onSubmit, onDelete }}
        />

        <Modal
          open={this.state.oauthSuccessModalOpen}
          onClose={this.oauthSuccessClose}
          center
          showCloseIcon={false}
        >
          <div>
            <h4>Authorization Successful</h4>
            Your network information has been saved, and the
            connection is active.
          </div>
          <button
            className="btn btn-primary push-right"
            onClick={this.gotoListPage}
          >
            OK
          </button>
          <button
            className="btn push-right"
            onClick={this.oauthSuccessClose}
          >
            Continue Editing
          </button>
        </Modal>

        <Modal
          open={this.state.oauthFailureModalOpen}
          onClose={this.oauthFailureClose}
          center
        >
          <div>
            <h4>Authorization Failed</h4>
            <div>
              {this.state.oauthFailureReason}
            </div>
            <div>
              You may continue editing the network information,
              or discard it.
            </div>
          </div>
          <button
            className="btn push-right"
            onClick={this.gotoListPage}
          >
            Save Anyway
          </button>
          <button
            className="btn push-right"
            onClick={this.oauthFailureClose}
          >
            Continue Editing
          </button>
          <button
            className="btn btn-danger push-right"
            onClick={this.onDelete}
          >
            Discard Network
          </button>

        </Modal>

        <Modal
          open={this.state.oauthNotifyModalOpen}
          onClose={this.oauthNotifyClose}
          center
        >
          <div>
            <h4>Redirecting to {this.state.network.name}</h4>
            <p>
              It looks like the information used to connect to this network
              is new, was updated, or has expired.
            </p>
            <p>
              You are about to be redirected to the {this.state.network.name} site, where you <i>may</i> be asked to log in and/or verify your
              intent to give this application access to your data there.  Once
              this process is complete, you will be returned here.
            </p>
          </div>
          <button
            className="btn btn-primary push-right"
            onClick={this.redirectForOauth}
          >
            Perform Authorization
          </button>
          <button
            className="btn push-right"
            onClick={this.oauthNotifyClose}
          >
            Continue Editing
          </button>

        </Modal>
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
  const network = networkId ? networkStore.getNetwork(networkId) : Promise.resolve({});

  return {
    networkTypes: await networkTypes,
    networkProtocols: propOr([], 'records', await networkProtocols),
    networkProviders: propOr([], 'records', await networkProviders),
    network: await network,
  };
}
