import React, {Component} from "react";
import {withRouter} from 'react-router-dom';

import networkStore from "../../stores/NetworkStore";
import networkProtocolStore from "../../stores/NetworkProtocolStore";
import sessionStore from "../../stores/SessionStore";
import PropTypes from 'prop-types';

// Values from env is in minutes.  Change to milliseconds.
let oauth_timeout = process.env.REACT_APP_OAUTH_TIMEOUT * 60 * 1000;


class OAuthNetwork extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super();

    console.log('this.props', this.props);
    console.log('props: ', props);
    let me = this;

    // Get the OAuth info saved in the logged in user's data.
    let target = sessionStore.getSetting("oauthNetworkTarget");
    let start = sessionStore.getSetting("oauthStartTime");
    let elapsed = Date.now() - start;
    // Get rid of these settings so they aren't reused.
    sessionStore.removeSetting("oauthNetworkTarget");
    sessionStore.removeSetting("oauthStartTime");

    // Make sure too much time hasn't passed for OAuth validation.
    if (elapsed <= oauth_timeout) {
        // target is the networkId
        networkStore.getNetwork(target)
        .then((nwk) => {
            networkProtocolStore.getNetworkProtocol(nwk.networkProtocolId)
            .then( netproto => {
                console.log('~~> then netproto', netproto);
                // Got the network and protocol data.  Update the security
                // settings with the data we expect to see.
                //STEVE:>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                // NOTE: Take this whole file, but the line below probably
                //       needs to be reworked for the real data.
                //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                let fields = netproto.metaData.protocolHandlerNetworkFields;
                let changed = false;
                // Walk through the fields, finding any expecting a query param.
                for (var field in fields) {
                    let param = field.displayWithQueryParameter;
                    // Got that param?
                    if (param) {
                        // Add it to the securityData as the name specified.
                        if (props.location.queryparam[param]) {
                            nwk.securityData[field.name] = props.location.queryparam[param];
                            changed = true;
                        }
                    }
                }
                // If we changed the network record, update it.
                if (changed) {
                    networkStore.updateNetwork(nwk)
                    .then((res) => {
                        // Go show the new record.
                        console.log("Network updated with OAuth credentials");
                        props.history.push('/admin/network/' + nwk.id);
                    })
                    .catch((err) => {
                        console.log("Network " + nwk.name + " update failed for adding OAuth credentials: " + err);
                        props.history.push('/admin/networks');
                    });
                }
            })
            .catch((err) => {
                console.log("Network Protocol GET for " + nwk.networkProtocolId + " failed for adding OAuth credentials: " + err);
                // TODO: this broke when timeout violated
                props.history.push('/admin/networks');
            });
        })
        .catch((err) => {
            console.log("Network GET for " + target + " failed for adding OAuth credentials: " + err);
            props.history.push('/admin/networks');
        });
    } else {
        console.log("OAuth timeout exceeded.  Ignoring response.");
        props.history.push('/admin/networks');
    }
  }

  // We just store the OAuth code and redirect - nothing to render.
  render() {
      return (<div></div>);
  }
}

export default withRouter(OAuthNetwork);
