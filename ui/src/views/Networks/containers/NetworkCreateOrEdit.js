import React, {Component} from "react";
import PT from 'prop-types';
import { withRouter } from 'react-router-dom';
import { propOr, pathOr, lensPath, set, pick, pathEq } from 'ramda';
import qs from 'query-string';
import { dispatchError, errorToText } from '../../../utils/errorUtils';
import { arrayify } from '../../../utils/generalUtils';
import sessionStore from "../../../stores/SessionStore";
import networkProtocolStore from "../../../stores/NetworkProtocolStore";
import networkStore from "../../../stores/NetworkStore";
import { inputEventToValue } from '../../../utils/inputUtils';
import { navigateToExernalUrl } from '../../../utils/navUtils';
import { findByPropVal } from '../../../utils/objectListUtils';
import {
  getProtocol, versionsFromProtocolSet, getProtocolSet,
  getSecurityProps, getSecurityDefaults, getProtocolVersionInfo
  } from '../../../utils/protocolUtils';
import NetworkForm from '../../../components/NetworkForm';
import ConfirmationDialog from '../../../components/ConfirmationDialog';

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
// NetworkCreateOrEdit container
//******************************************************************************

const networkProps = [
  'id', 'name', 'networkProviderId', 'networkTypeId',
  'networkProtocolId', /* 'networkProtocolVersion', */ 'baseUrl', 'securityData'
];

class NetworkCreateOrEdit extends Component {

  static contextTypes = {
    router: PT.object.isRequired
  };

  constructor(props, ...rest) {
    super(props, ...rest);

    this.state = {

      // pending values for network being created/updated.
      name: '',
      networkProviderId: 0,
      networkTypeId: 0,
      networkProtocolId: 0,
      baseUrl: '',
      securityData: {},

      // bookkeeping
      networkId: -1, // Set when entering upon edit, or upon return from POST
      networkProtocol: {},
      networkProtocolSet: [],
      networkProtocolVersion: {},
      authNeeded: false,
        // T if new, unauthorized, or security field changed on existing NW
      securityDataChanged: false,
        // T if security field changed on existing NW (false in all other cases)
      successModalOpen: false,
      failureModalOpen: false,
      authErrorMessages: [],
      authSuccessMessages: [],
      dirtyFields: {}
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.gotoListPage = this.gotoListPage.bind(this);
    this.successModal = this.successModal.bind(this);
    this.failureModal = this.failureModal.bind(this);
    this.oauthNotify = this.oauthNotify.bind(this);
    this.successModalClose = this.successModalClose.bind(this);
    this.failureModalClose = this.failureModalClose.bind(this);
    this.oauthNotifyClose = this.oauthNotifyClose.bind(this);
  }

  componentDidMount() {

    // NOTES: we may be here because
    // * starting to create a new network
    // * starting to edit an existing network
    // * returing from ouath attempt on a network create/update

    const { isNew, networkId } = this.props;

    fetchNetworkInfo(!isNew && networkId)
    .then(({ network, networkProtocols })=> {

      const queryParams = qs.parse(pathOr({}, [ 'location', 'search' ],  this.props));

      const typeId = isNew ?
        Number(propOr(-1,'networkTypeId', queryParams)) :
        propOr(-1, 'networkTypeId', network);

      const protocolId = isNew ?
        Number(propOr(-1, 'networkProtocolId', queryParams)) :
        propOr(-1, 'networkProtocolId', network);

      const networkProtocolSet =  getProtocolSet(typeId, protocolId, networkProtocols);
      const networkProtocol = getProtocol(typeId, protocolId, networkProtocols);
      const networkProtocolName = propOr('-error-', 'name', networkProtocol);
      const networkProtocolVersion = getProtocolVersionInfo(typeId, protocolId, networkProtocolSet, network );

      const networkData = isNew ?
      {
        name: '',
        networkProviderId: -1, // for now, not providing network provider
        networkTypeId: typeId,
        networkProtocolId: protocolId,
        baseUrl: '',
        securityData: getSecurityDefaults(networkProtocol),
      }
      : pick(networkProps, network);

      const authNeeded = isNew || !pathEq([ 'securityData', 'authorized' ], true, networkData);
      const networkId = isNew ? -1 : propOr(-1, 'id', network);
      this.setState({ networkId, authNeeded, networkProtocol, networkProtocolVersion, networkProtocolSet, ...networkData });

      // Lets see if we are coming back from an oauth
      const oauthStatus = propOr('', 'oauthStatus', queryParams);
      if ( oauthStatus ) {


        const oauthMode = propOr('unkown', 'oauthMode', queryParams);
        const authorized = pathOr(false, ['securityData', 'authorized'], networkData);
        const serverAuthMessage = pathOr('', ['securityData', 'message'], networkData);
        const oauthErrorMessage = propOr('', 'oauthError', queryParams);
        const serverErrorMessage = propOr('', 'serverError', queryParams);

        // success after update
        if ( oauthStatus === 'success' && oauthMode === 'afterUpdate' && authorized ) {
          this.successModal([
            `After updating your ${networkProtocolName} authorization information, authorization was succeseful.`
          ]);
        }

        // success after create
        else if ( oauthStatus === 'success' && authorized ) {
          this.successModal();
        }

        // good oauth, but back end test failed
        else if ( oauthStatus === 'success' && !authorized ) {
          this.failureModal([
            `Your authorization information was valid, but LPWAN server was not able to connect to the ${networkProtocolName} server`,
            serverErrorMessage, serverAuthMessage ]);
        }

        // oauth failed
        else if ( oauthStatus === 'fail' && !authorized ) {
          this.failureModal([
            `Your ${networkProtocolName} authorization information was not valid`,
            oauthErrorMessage ]);
        }

        // should never hit this case
        else if ( oauthStatus === 'fail' && authorized ) {
          this.failureModal([
            `Your authorization information seemed to be invalid, but you appear to be authorized`,
            'This is an abnormal state.  It is advised that you reauthorize with this network by re-entering your authorizaion information',
            oauthErrorMessage ]);
        }
      }
    })
    .catch(err => dispatchError(
      `Error retrieving information while trying to ${isNew?'create':'edit'} ` +
      `network ${isNew?'':networkId}: ${errorToText(err)}`
    ));
  }

  onChange(path, field, e) {

    console.log('~~> onChange(): ', field);

    const value = inputEventToValue(e);
    const { dirtyFields={}, networkProtocol={}, networkProtocolVersion, networkProtocolSet, authNeeded } = this.state;
    const { isNew } = this.props;

    const fieldLens = lensPath([...path, field]);
    const pendingDirtyFields = set(fieldLens, true, dirtyFields);
    const pendingSecurityDataChanged = hasSecurityDataChanged(networkProtocol, pendingDirtyFields);
    const pendingAuthNeeded = isNew || authNeeded || pendingSecurityDataChanged;
    const pendingNetworkProtocolVersion = field === 'networkProtocolVersion' ?
      findByPropVal('', '', pathOr([],[], networkProtocolSet)) :
      networkProtocolVersion;

      // // '' -> a -> [{}] -> {}
      // export const findByPropVal = curry((propName, propVal, objList) =>


    console.log('networkProtocolSet: ', networkProtocolSet);
    console.log('pendingNetworkProtocolVersion: ', pendingNetworkProtocolVersion);

    this.setState({
      ...set(fieldLens, value, this.state),
      authNeeded: pendingAuthNeeded,
      securityDataChanged: pendingSecurityDataChanged,
      dirtyFields: pendingDirtyFields,
    });
  }

  onSubmit(e) {

    e.preventDefault();
    const { isNew } = this.props;
    const { networkProtocol, securityData={}, authNeeded } = this.state;

    const networkProtocolName = propOr('-error-', 'name', networkProtocol);
    const securityProps = getSecurityProps(networkProtocol);

    const securityDataToSubmit = authNeeded && !isNew ?
      { ...pick(securityProps, securityData), authorized: false } :
      pick(securityProps, securityData);

    const pendingNetwork = ({
      ...pick(networkProps, this.state),
      securityData: securityDataToSubmit
    });

    const mutateMethod = isNew ? 'createNetwork' : 'updateNetwork';
    networkStore[mutateMethod](pendingNetwork)

    .then( updatedNetwork => {

      const networkId = propOr(-1, 'id', updatedNetwork);
      const oauthUrl = pathOr('', ['metaData', 'oauthUrl'], networkProtocol);
      const authorized = pathOr(false, ['securityData', 'authorized'], updatedNetwork);
      const serverAuthMessage = pathOr('', ['securityData', 'message'], updatedNetwork);

      this.setState({ networkId });

      // go to oauth page if needed
      if (oauthUrl && authNeeded) {
        const oauthRedirect = makeOauthRedirectUrl(networkProtocol, securityData,);
        sessionStore.putSetting('oauthMode', isNew ? 'afterCreate' : 'afterUpdate');
        sessionStore.putSetting('oauthNetworkTarget', networkId);
        sessionStore.putSetting('oauthStartTime', Date.now());
        navigateToExernalUrl(oauthRedirect);
      }

      // non-ouath backend auth succeeded
      else if (isNew && authorized) {
        this.successModal();
      }

      // non-ouath backend conneciton test succeeded
      else if ( !isNew && authNeeded && authorized) {
        this.successModal([
          `After updating your ${networkProtocolName} authorization information, authorization was succeseful.`]);
      }

      // non-ouath backend conneciton test failed for new network
      else if (isNew && !authorized) {
        this.failureModal([
          `Your ${networkProtocolName} authorization information was not valid`, serverAuthMessage, ]);
      }

      // non-ouath backend conneciton test failed for updated network
      else if (!isNew && authNeeded && !authorized) {
        this.failureModal([
          `After updating your ${networkProtocolName} authorization information, authorization failed.`,
          `The updated authorization information was not valid`, serverAuthMessage ]);
      }

      // otherwise go to network list page
      else {
        this.props.history.push('/admin/networks');
      }
    })

    // the create/update failed
    .catch( err => {
      this.failureModal([ `Your ${networkProtocolName} Submit failed: ${errorToText(err)}` ]);});
    }

  onDelete(e) {

    e.preventDefault();
    const { networkId } = this.state;
    !networkId && console.warn('NetworkCreateOrEdit: attempted to delete network w/o ID');

    //eslint-disable-next-line
    if (networkId && confirm("Are you sure you want to delete this network?")) {
      networkStore.deleteNetwork(networkId)
      .then( (responseData) => {this.props.history.push('/admin/networks');})
      .catch( (err) => { alert( "Delete failed:" + err ); } );
    }
  }

  gotoListPage = () => this.props.history.push('/admin/networks');
  successModal = (msgs=[]) => this.setState({successModalOpen: true, authSuccessMessages: arrayify(msgs)});
  failureModal = (msgs=[]) => this.setState({failureModalOpen: true, authErrorMessages: arrayify(msgs)});
  successModalClose = () => this.setState({successModalOpen: false, authSuccessMessages: []});
  failureModalClose = () => this.setState({failureModalOpen: false, authErrorMessages: []});
  oauthNotify = () => this.setState({oauthNotifyModalOpen: true});
  oauthNotifyClose = () => this.setState({oauthNotifyModalOpen: false});
  setModalErrorMessages = messages => this.setState({ authErrorMessages : messages });
  continueEditing = networkId => this.props.history.push(`/remount?to=/admin/network/${networkId}`);
    // remount so that we get all latest info from backend, and corrrect incoming state

  render() {

    const { networkProtocol, networkProtocolSet, networkProtocolVersion, authNeeded, securityDataChanged, networkId } = this.state;
    const { isNew } = this.props;
    const { onChange, onSubmit, onDelete } = this;

    const networkData = pick(networkProps, this.state);
    const networkProtocolName = propOr('-error-', 'name', networkProtocol);
    const networkProtocolVersionList = versionsFromProtocolSet(networkProtocolSet);

    const submitText = generateSubmitText(isNew, authNeeded, securityDataChanged, networkProtocolName);

    return (
      <div>
        <NetworkForm
          {...{ onChange, onSubmit, onDelete }}
          {...{ isNew, submitText, networkProtocol, networkProtocolVersion, networkProtocolVersionList, networkData }}
        />

      <ConfirmationDialog
        open={this.state.successModalOpen}
        title='Network Succesfully Authorized'
        subTitle={`You are authorized with ${networkProtocolName}, and will now be able to add applications and devices`}
        text={this.state.authSuccessMessages||[]} textClass='txt-color-alt'
        confButtons={[{ label: 'OK', className: 'btn-primary', onClick: this.gotoListPage }]}
      />

      <ConfirmationDialog
        open={this.state.failureModalOpen}
        title='Authorization Failed'
        subTitle='You may continue editing the network, discard it, or save the information you entered without network authorization'
        text={this.state.authErrorMessages||[]} textClass='text-danger'
        confButtons={[
          { label: 'Discard Network', className: 'btn-danger', onClick: this.onDelete, },
          { label: 'Continue Editing', className: 'btn-default', onClick: () => this.continueEditing(networkId), },
          { label: 'Save', className: 'btn-default', onClick: this.gotoListPage, },
        ]}
      />
      </div>
    );
  }
}

export default withRouter(NetworkCreateOrEdit);

NetworkCreateOrEdit.propTypes = propTypes;
NetworkCreateOrEdit.defaultProps = defaultProps;

//******************************************************************************
// Helper Functions
//******************************************************************************

function makeOauthRedirectUrl(networkProtocol, securityData) {

  const oauthUrl = pathOr('', ['metaData', 'oauthUrl'], networkProtocol);
  if ( !oauthUrl ) return '';

  const thisServer = process.env.REACT_APP_PUBLIC_BASE_URL;
  const frontEndOauthReturnUri = `${thisServer}/admin/networks/oauth`;
  const queryParams = pathOr([], ['metaData', 'oauthRequestUrlQueryParams'], networkProtocol);

  const queryParamString = queryParams.reduce((qpStr, qp, i)=>
    `${qpStr}${i>0 ? '&':'?'}${makeQueryParam(qp, securityData, frontEndOauthReturnUri)}`, '');

  return `${oauthUrl}${queryParamString}`;
}

function makeQueryParam(qeuryParamSpec={}, securityData={}, frontEndOauthReturnUri ) {
  const { name, valueSource, value, protocolHandlerNetworkField } = qeuryParamSpec;

  const queryValue =
    valueSource === 'value' ? value :
    valueSource === 'protocolHandlerNetworkField' ? securityData[protocolHandlerNetworkField] :
    valueSource === 'frontEndOauthReturnUri' ? frontEndOauthReturnUri : 'unknown value source';
  return `${name}=${queryValue}`;
}

// pass in falsey networkId to skip network fetch
// throws error for fetch problem
async function fetchNetworkInfo(networkId) {
  const networkProtocols = networkProtocolStore.getNetworkProtocols();
  const network = networkId ? networkStore.getNetwork(networkId) : Promise.resolve({});

  return {
    network: await network,
    networkProtocols: propOr([], 'records', await networkProtocols),
  };
}

function hasSecurityDataChanged(networkProtocol, dirtyFields) {
  const securityProps = getSecurityProps(networkProtocol);
  return (
    propOr(false, 'baseUrl', dirtyFields) ||
    areSecurityPropsDirty(securityProps, dirtyFields)
  );
}

function areSecurityPropsDirty(securityProps, dirtyFields) {
  return securityProps.reduce((dirty,securityProp) =>
    dirty || pathOr(false, [ 'securityData', securityProp ], dirtyFields),false);
}

function generateSubmitText(isNew, authNeeded, securityDataChanged, networkProtocolName) {
  return securityDataChanged && !isNew ? [
    `${networkProtocolName} authoriztion information changed. You will be re-authorized  with the ${networkProtocolName} provider.`,
    'You may be directed to provide appropriate credentials.'
  ] :
  authNeeded ? [
    `You will be authorized with the ${networkProtocolName} provider.`,
    'You may be directed to provide appropriate credentials.'
  ] : '';
}
