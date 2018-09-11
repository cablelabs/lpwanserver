import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { pathOr, propOr, isEmpty, pick, keys } from 'ramda';
import qs from 'query-string';
import { capitalize, removeUnderscores } from '../../utils/stringUtils';
import { dispatchError } from '../../utils/errorUtils';
import networkStore from '../../stores/NetworkStore';
import networkProtocolStore from '../../stores/NetworkProtocolStore';
import sessionStore from '../../stores/SessionStore';
import { getSecurityProps } from '../../utils/protocolUtils';

// Values from env is in minutes.  Change to milliseconds.
const oauthTimeout = Number(process.env.REACT_APP_OAUTH_TIMEOUT) * 60 * 1000;

//******************************************************************************
// The Component
//******************************************************************************

// Notes
// * we get here after returning from entering oauth credientials with a 3rd party
// * if oauth fails, nothing sent to backend, and we send error information to Network component
// * if oauth succeeds, we pull info from the return URI and PUT those changes to the server
//   - server tests connection with supplied oauth info, which may succeed or fail
//   - server attempts to update Network info in the DB based on the PUT
//   - server returns success (200) if new info is succesfully saved to DB, even if auth test fails
//   - if the server auth test was not succesful, then network.securityData.authorized will be false
// * We redirect to Network component, with the following info sent as query parans
//   - oauthStatus=success|fail (tells if oauth login was succesful)
//   - oauthError=`errorMsg`  // for reporting oauthErrors
//   - serverError=`errorMsg` // for reporting server errors, which might occur even if oauth is succeseful

class OAuthNetwork extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    const oauthMode = sessionStore.getSetting('oauthMode');
    const targetNetworkId = sessionStore.getSetting('oauthNetworkTarget');
    const oauthStartTime = Number(sessionStore.getSetting('oauthStartTime'));

    const queryParams = qs.parse(pathOr({}, [ 'location', 'search' ], props));
    const elapsedTime = Date.now() - oauthStartTime;

    sessionStore.removeSetting('oauthNetworkTarget');
    sessionStore.removeSetting('oauthStartTime');
    sessionStore.removeSetting('oauthMode');

    const networkPath = `/admin/network/${targetNetworkId}?oauthMode=${oauthMode}`;

    if (elapsedTime > oauthTimeout) {
      const errMsg = encodeURIComponent('Authorization attempt timed out.  Please try again');
      return props.history.push(`${networkPath}&oauthStatus=fail&oauthError=${errMsg}`);
    }

    fetchNetworkInfo(targetNetworkId)
    .then(({ network, networkProtocol }) => {

      // lets see if we any errors were reported from oauth page
      const errorParamList = pathOr([], [ 'metaData', 'oauthResponseUrlErrorParams' ], networkProtocol);
      const errorParams =  pick(errorParamList, queryParams);

      // Oauth succeeded
      if (isEmpty(errorParams)) {



        // send oauth info to server
        updateNetworkWithOauthInfo(network, networkProtocol, queryParams)

        // Network was succesfully updated
        .then(() => {
          props.history.push(`${networkPath}&oauthStatus=success`);
        })

        // Oauth worked, but server was not able to update/create network
        .catch(() => {
          const errorMsg = 'Server was not able to create/update the network';
          props.history.push(`${networkPath}&oauthStatus=success&serverError=${errorMsg}`);
        });
      }

      // Oauth failed
      else {
        const errMsg = keys(errorParams).reduce((emsg, ekey, i) => `${emsg} ${removeUnderscores(capitalize(errorParams[ekey]))}.`,'');
        props.history.push(`${networkPath}&oauthStatus=fail&oauthError=${encodeURIComponent(errMsg)}`);
      }
    })

    // Failed to fetch network and/or networkProtocol, can't continue oauth.
    // Report the error and go to network list
    .catch(e=>{
      const errMsg = e && e.message ? e.message : e;
      dispatchError(`Authorizaiton failed, LPWAN network errer. ${errMsg}`);
      props.history.push('/admin/networks');
    });
  }

  // We just store the OAuth code and redirect - nothing to render.
    render() {
      return (<div></div>);
  }
}

export default withRouter(OAuthNetwork);


//******************************************************************************
// Helper Functions
//******************************************************************************

// get the network info, throws error if network or network protocol can't be fetched
async function fetchNetworkInfo(networkId) {

  const network = networkId ? await networkStore.getNetwork(networkId) : {};
  const networkProtocolId = propOr(null, 'networkProtocolId', network);
  const networkProtocol = networkProtocolId ?
    await networkProtocolStore.getNetworkProtocol(networkProtocolId) : {};

  return { network, networkProtocol };
}


// updates network with oauth info, throws error if update is not succesful
async function updateNetworkWithOauthInfo(network, networkProtocol, queryParams) {

  const { securityData={} } = network;
  const securityProps = getSecurityProps(networkProtocol);

  // see if we are supposed to send antyhing onto the server
  const reponseParamList = pathOr([], [ 'metaData', 'oauthResponseUrlQueryParams' ], networkProtocol);
  const responseParams = pick(reponseParamList, queryParams);

  const updatedSecrityData = {
    ...pick(securityProps, securityData),
    ...responseParams
  };

  return isEmpty(responseParams) ?
    network :
    await networkStore.updateNetwork({
      ...network,
      securityData: updatedSecrityData
  });
}
