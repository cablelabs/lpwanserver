// TODO:
// * get the units for time out straight and consitent here, and in .env file

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { pathOr, propOr, isEmpty, isNil, pick, keys } from 'ramda';
import qs from 'query-string';
import dispatcher from "../../dispatcher";
import networkStore from '../../stores/NetworkStore';
import networkProtocolStore from '../../stores/NetworkProtocolStore';
import sessionStore from '../../stores/SessionStore';
import PropTypes from 'prop-types';

// Values from env is in minutes.  Change to milliseconds.
const oauthTimeout = Number(process.env.REACT_APP_OAUTH_TIMEOUT * 60 * 1000);

//******************************************************************************
// The Compnent
//******************************************************************************

class OAuthNetwork extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    const targetNetworkId = sessionStore.getSetting('oauthNetworkTarget');
    const queryParams = qs.parse(pathOr('', [ 'location', 'search' ], props));
    const oauthStartTime = Number(sessionStore.getSetting('oauthStartTime'));
    const elapsedTime = Date.now() - oauthStartTime;

    // TODO temporarily commented out for easier testing
    // sessionStore.removeSetting('oauthNetworkTarget');
    // sessionStore.removeSetting('oauthStartTime');

    // TODO: test the time out
    if (elapsedTime <= oauthTimeout) {
      handleOauthReturn(targetNetworkId,queryParams)
        .then(({ network, networkProtocol }) => {
          const networkName = propOr('?', 'name', network);
          const protocolName = propOr('?', 'name', networkProtocol);
          console.log(`Authorization of network '${protocolName}' ${networkName} succeeded`);
          // TODO: put up a toast with above message
          props.history.push('/admin/networks');
        })
        .catch( err => dispatchError(
          'Error while attemping to authorize with the remote network provider. ' +
          propOr('', 'message', err) + ' Please try again'
        ));
    }
    else {
      dispatchError('Authorization attempt timed out.  Please try again');
      props.history.push(`/admin/networks`);
    }

    // if we get here, there was a problem, so go to network edit page
    props.history.push(`/admin/network/${targetNetworkId}`);
  }

  // We just store the OAuth code and redirect - nothing to render.
  render() {
      return (<div>OAuthNetwork: You should never see this</div>);
  }
}

export default withRouter(OAuthNetwork);


//******************************************************************************
// Helper Functions
//******************************************************************************

function dispatchError(error) {
  console.warn(error);
  return dispatcher.dispatch({ type: "CREATE_ERROR", error });
}

// TODO: put in general utilty
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// TODO: put in general utilty
function removeUnderscores(str) {
    return str.replace(/_/g, ' ');
}

async function handleOauthReturn(targetNetworkId, queryParams) {

  const network = await networkStore.getNetwork(targetNetworkId);
  const networkProtocol = network && network.networkProtocolId ?
    await networkProtocolStore.getNetworkProtocol(network.networkProtocolId) : null;

  if ( isNil(network) || isNil(networkProtocol))
    throw new Error(`Unable to fetch network/networkProtocol data during oauth for network ${targetNetworkId}`);

    const errorParamList = pathOr([], [ 'metaData', 'oauthResponseUrlErrorParams' ], networkProtocol);
    const errorParams =  pick(errorParamList, queryParams);

    // Oauth succeeded
    if (isEmpty(errorParams)) {
      const reponseParamList = pathOr([], [ 'metaData', 'oauthResponseUrlQueryParams' ], networkProtocol);
      const responseParams = pick(reponseParamList, queryParams);
      if (!isEmpty(responseParams)) {
        const securityData = {
          ...propOr({}, 'securityData', network),
          ...responseParams
        };
        await networkStore.updateNetwork({ ...network, securityData });
        return { network, networkProtocol };
     }
   }

   // Oauth failed
   else {
     throw new Error(
       `Trying to authorize network '${propOr('?', 'name', network)}'. ` +
       keys(errorParams).reduce((emsg, ekey)=>
        `${emsg} ${capitalize(ekey)}: ${removeUnderscores(errorParams[ekey])}.`,'')
     );
   }
 }
