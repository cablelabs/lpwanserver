import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { pathOr, propOr } from 'ramda';
import qs from 'query-string';
import networkStore from '../../stores/NetworkStore';
import networkProtocolStore from '../../stores/NetworkProtocolStore';
import sessionStore from '../../stores/SessionStore';
import PropTypes from 'prop-types';

// Values from env is in minutes.  Change to milliseconds.
let oauthTimeout = process.env.REACT_APP_OAUTH_TIMEOUT * 60 * 1000;

// TODO:
// * get an auth to work
// * deal with no code / errors properly



class OAuthNetwork extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    console.log('~~> OAuthNetwork()');

    const targetNetworkId = sessionStore.getSetting('oauthNetworkTarget');
    const oauthStartTime = sessionStore.getSetting('oauthStartTime');
    const queryParams = qs.parse(pathOr('', [ 'location', 'search' ], props));
    const elapsedTime = Date.now() - oauthStartTime;

    console.log('elapsedTime: ', elapsedTime);
    console.log('targetNetworkId: ', targetNetworkId);
    console.log('queryParams: ', queryParams);


    // TODO: temporarily commented out for easier testing
    // sessionStore.removeSetting('oauthNetworkTarget');
    // sessionStore.removeSetting('oauthStartTime');


    if (elapsedTime > oauthTimeout) {
      console.warn('OAuth timeout exceeded.  Ignoring response.');
      // props.history.push('/admin/networks');
    }
    else if ( queryParams.error) {
      // TODO: this is very much TTN specific, need to figure out a way
      // to tell OAuthNetworks what to look for for errors
      console.warn('Error reported by TTN');
      // props.history.push('/admin/networks');
    }
    else if ( !queryParams.code) {
      // TODO: this is very muchn TTN specific, need to figure out a way
      // to tell OAuthNetworks what to look for security data
      console.warn('No TTN code provided');
      // props.history.push('/admin/networks');
    }

    else {

      console.log('Looks like TTN OAuth worked');
      let network = null;
      networkStore.getNetwork(targetNetworkId)
      .then( nw => {
        network = nw;
        return networkProtocolStore.getNetworkProtocol(network.networkProtocolId);
      })
      .then( networkProtocol => {
        console.log('networkProtocol: ', networkProtocol);
        console.log('network: ', network);
        // NOTE: currently the medaData fields are not returned by GET networkProcools/:id
        // A bug has been created for that
      })
      .catch( err => {
          const networkName = propOr('', 'name', network);
          console.warn(`Unable to add Oauth credentials for ${networkName}: ${err}`);
          props.history.push('/admin/networks');

      });



      // networkStore.updateNetwork({
      //   id: targetNetworkId,
      //   securityData : { accessCode: queryParams.code }})
      // .then( res => {
      //     console.log('Network updated with OAuth credentials');
      // })
      // .catch((err) => {
      //     console.log('Network ' + targetNetworkId + ' update failed for adding OAuth credentials: ' + err);
      // });

      // commented out for now for easier debugging
      // props.history.push('/admin/networks');
    }



    //                 networkStore.updateNetwork(nwk)
    //                 .then((res) => {
    //                     // Go show the new record.
    //                     console.log('Network updated with OAuth credentials');
    //                     props.history.push('/admin/network/' + nwk.id);
    //                 })
    //                 .catch((err) => {
    //                     console.log('Network ' + nwk.name + ' update failed for adding OAuth credentials: ' + err);
    //                     props.history.push('/admin/networks');
    //                 });



    // props.history.push(`/admin/network${props.location.search}`);


    // console.log('this.props', this.props);
    // console.log('props: ', props);
    // let me = this;
    //
    // // Get the OAuth info saved in the logged in user's data.
    // let target = sessionStore.getSetting('oauthNetworkTarget');
    // let start = sessionStore.getSetting('oauthStartTime');
    // let elapsed = Date.now() - start;
    // // Get rid of these settings so they aren't reused.
    // sessionStore.removeSetting('oauthNetworkTarget');
    // sessionStore.removeSetting('oauthStartTime');
    //
    // // Make sure too much time hasn't passed for OAuth validation.
    // if (elapsed <= oauth_timeout) {
    //     // target is the networkId
    //     networkStore.getNetwork(target)
    //     .then((nwk) => {
    //         networkProtocolStore.getNetworkProtocol(nwk.networkProtocolId)
    //         .then( netproto => {
    //             console.log('~~> then netproto', netproto);
    //             // Got the network and protocol data.  Update the security
    //             // settings with the data we expect to see.
    //             //STEVE:>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    //             // NOTE: Take this whole file, but the line below probably
    //             //       needs to be reworked for the real data.
    //             //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    //             let fields = netproto.metaData.protocolHandlerNetworkFields;
    //             let changed = false;
    //             // Walk through the fields, finding any expecting a query param.
    //             for (var field in fields) {
    //                 let param = field.displayWithQueryParameter;
    //                 // Got that param?
    //                 if (param) {
    //                     // Add it to the securityData as the name specified.
    //                     if (props.location.queryparam[param]) {
    //                         nwk.securityData[field.name] = props.location.queryparam[param];
    //                         changed = true;
    //                     }
    //                 }
    //             }
    //             // If we changed the network record, update it.
    //             if (changed) {
    //                 networkStore.updateNetwork(nwk)
    //                 .then((res) => {
    //                     // Go show the new record.
    //                     console.log('Network updated with OAuth credentials');
    //                     props.history.push('/admin/network/' + nwk.id);
    //                 })
    //                 .catch((err) => {
    //                     console.log('Network ' + nwk.name + ' update failed for adding OAuth credentials: ' + err);
    //                     props.history.push('/admin/networks');
    //                 });
    //             }
    //         })
    //         .catch((err) => {
    //             console.log('Network Protocol GET for ' + nwk.networkProtocolId + ' failed for adding OAuth credentials: ' + err);
    //             // TODO: this broke when timeout violated
    //             props.history.push('/admin/networks');
    //         });
    //     })
    //     .catch((err) => {
    //         console.log('Network GET for ' + target + ' failed for adding OAuth credentials: ' + err);
    //         props.history.push('/admin/networks');
    //     });
    // } else {
    //     console.log('OAuth timeout exceeded.  Ignoring response.');
    //     props.history.push('/admin/networks');
    // }
  }

  // We just store the OAuth code and redirect - nothing to render.
  render() {
      return (<div>OAuthNetwork: You should never see this</div>);
  }
}



export default withRouter(OAuthNetwork);
