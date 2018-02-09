import React, {Component} from "react";
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import sessionStore from "../../stores/SessionStore";
import networkTypeStore from "../../stores/NetworkTypeStore";
import NetworkTypeForm from "../../components/NetworkTypeForm";


class NetworkTypeLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      networkType: {},
      isGlobalAdmin: sessionStore.isGlobalAdmin(),
    };

    sessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: (sessionStore.isGlobalAdmin())
      });
    });

    networkTypeStore.getNetworkType( props.match.params.networkTypeID ).then( (networkType) => {
        this.setState( { networkType: networkType } );
    })
    .catch( ( err ) => { this.props.history.push('/admin/networkTypes'); });

    this.onSubmit = this.onSubmit.bind(this);
  }

    onSubmit() {
      networkTypeStore.updateNetworkType( this.state.networkType ).then( (data) => {
        this.props.history.push('/admin/networkTypes');
      })
      .catch( (err) => {
          alert( "NetworkType delete failed: ", err );
      });

  }

  render() {

    if ( !this.state.networkType.id ) {
        return ( <div></div> );
    }

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/networkTypes`}>Network Types</Link></li>
          <li className="active">{this.state.networkType.name}</li>
        </ol>
        <div className="panel-body">
          <NetworkTypeForm networkType={this.state.networkType} onSubmit={this.onSubmit} update={true}/>
        </div>
      </div>
    );
  }
}

export default NetworkTypeLayout;
