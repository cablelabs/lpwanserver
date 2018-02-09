import React, {Component} from "react";
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import sessionStore from "../../stores/SessionStore";
import networkProtocolStore from "../../stores/NetworkProtocolStore";
import NetworkProtocolForm from "../../components/NetworkProtocolForm";


class NetworkProtocolLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      networkProtocol: {},
      isGlobalAdmin: sessionStore.isGlobalAdmin(),
    };

    sessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: (sessionStore.isGlobalAdmin())
      });
    });

    networkProtocolStore.getNetworkProtocol( props.match.params.networkProtocolID ).then( (networkProtocol) => {
        this.setState( { networkProtocol: networkProtocol } );
    })
    .catch( ( err ) => { this.props.history.push('/admin/networkProtocols'); });

    this.onSubmit = this.onSubmit.bind(this);
  }

    onSubmit() {
      networkProtocolStore.updateNetworkProtocol( this.state.networkProtocol ).then( (data) => {
        this.props.history.push('/admin/networkProtocols');
      })
      .catch( (err) => {
          alert( "NetworkProtocol update failed: ", err );
      });

  }

  render() {

    if ( !this.state.networkProtocol.id ) {
        return ( <div></div> );
    }

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/networkProtocols`}>Network Protocols</Link></li>
          <li className="active">{this.state.networkProtocol.name}</li>
        </ol>
        <div className="panel-body">
          <NetworkProtocolForm networkProtocol={this.state.networkProtocol} onSubmit={this.onSubmit} update={true}/>
        </div>
      </div>
    );
  }
}

export default NetworkProtocolLayout;
