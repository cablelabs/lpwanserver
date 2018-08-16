// TODO:
// * get the units for time out straight and consitent here, and in .env file

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

// Values from env is in minutes.  Change to milliseconds.
const oauthTimeout = Number(process.env.REACT_APP_OAUTH_TIMEOUT * 60 * 1000);

//******************************************************************************
// The Component
//******************************************************************************

class OAuthNetwork extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    const targetNetworkId = sessionStore.getSetting('oauthNetworkTarget');
    const queryParams = qs.parse(pathOr({}, [ 'location', 'search' ], props));
    const oauthStartTime = Number(sessionStore.getSetting('oauthStartTime'));
    const elapsedTime = Date.now() - oauthStartTime;

    sessionStore.removeSetting('oauthNetworkTarget');
    sessionStore.removeSetting('oauthStartTime');

    // TODO: test the time out
    if (elapsedTime > oauthTimeout) {
      const errMsg = encodeURIComponent('Authorization attempt timed out.  Please try again');
      return props.history.push(`/admin/network/${targetNetworkId}?oauthStatus=fail&oauthError=${errMsg}`);
    }

    fetchNetworkInfo(targetNetworkId)
    .then(({ network, networkProtocol }) => {

      // lets see if we any errors were reported from oauth page
      const errorParamList = pathOr([], [ 'metaData', 'oauthResponseUrlErrorParams' ], networkProtocol);
      const errorParams =  pick(errorParamList, queryParams);

      // Oauth succeeded
      if (isEmpty(errorParams)) {
        updateNetworkWithOauthInfo(network, networkProtocol, queryParams)

        // Everyting worked
        .then(() => {
          console.log('OAuthNetwork: oauth success, BE test success');
          props.history.push(`/admin/network/${targetNetworkId}?oauthStatus=success`);
        })

        // Oauth worked, but server could not complete authorization.  Let netowrk page construct error message
        .catch(() => {
          console.log('OAuthNetwork: oauth success, BE test failed');
          props.history.push(`/admin/network/${targetNetworkId}?oauthStatus=success`);
        });
      }

      // Oauth failed
      else {
        console.log('OAuthNetwork: oauth fail');
        const errMsg = keys(errorParams).reduce((emsg, ekey, i) => `${emsg} ${removeUnderscores(capitalize(errorParams[ekey]))}.`,'');
        props.history.push(`/admin/network/${targetNetworkId}?oauthStatus=fail&oauthError=${encodeURIComponent(errMsg)}`);
      }
    })

    // Failed to fetch network and/or networkProtocol, can't continue oauth.
    // Report the error and go to network list
    .catch(e=>{
      console.log('OAuthNetwork: post oauth network fetch fail');
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

  // see if we are supposed to send antyhing onto the server
  const reponseParamList = pathOr([], [ 'metaData', 'oauthResponseUrlQueryParams' ], networkProtocol);
  const responseParams = pick(reponseParamList, queryParams);

  const securityData = {
    ...propOr({}, 'securityData', network),
    ...responseParams
  };

  return isEmpty(responseParams) ?
    network :
    await networkStore.updateNetwork({ ...network, securityData });
}
