import React, {Component} from "react";
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import sessionStore from "../../stores/SessionStore";
import networkProviderStore from "../../stores/NetworkProviderStore";
import NetworkProviderForm from "../../components/NetworkProviderForm";


class NetworkProviderLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      networkProvider: {},
      isGlobalAdmin: sessionStore.isGlobalAdmin(),
    };

    sessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: (sessionStore.isGlobalAdmin())
      });
    });

    networkProviderStore.getNetworkProvider( props.match.params.networkProviderID ).then( (networkProvider) => {
        this.setState( { networkProvider: networkProvider } );
    })
    .catch( ( err ) => { this.props.history.push('/admin/networkProviders'); });

    this.onSubmit = this.onSubmit.bind(this);
  }

    onSubmit() {
      networkProviderStore.updateNetworkProvider( this.state.networkProvider ).then( (data) => {
        this.props.history.push('/admin/networkProviders');
      })
      .catch( (err) => {
          alert( "NetworkProvider delete failed: ", err );
      });

  }

  render() {

    if ( !this.state.networkProvider.id ) {
        return ( <div></div> );
    }

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/networkProviders`}>Network Providers</Link></li>
          <li className="active">{this.state.networkProvider.name}</li>
        </ol>
        <div className="panel-body">
          <NetworkProviderForm networkProvider={this.state.networkProvider} onSubmit={this.onSubmit} update={true}/>
        </div>
      </div>
    );
  }
}

export default NetworkProviderLayout;
