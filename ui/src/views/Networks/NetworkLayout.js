import React, {Component} from "react";
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import networkStore from "../../stores/NetworkStore";
import NetworkForm from "../../components/NetworkForm";


class NetworkLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      network: {},
    };

    networkStore.getNetwork( props.match.params.networkID ).then( (network) => {
        this.setState( { network: network } );
    })
    .catch( ( err ) => { this.props.history.push('/admin/networks'); });

    this.onSubmit = this.onSubmit.bind(this);
  }

    onSubmit() {
    console.log( "Network update:", this.state.network );
      networkStore.updateNetwork( this.state.network ).then( (data) => {
        this.props.history.push('/admin/networks');
      })
      .catch( (err) => {
          alert( "Network update failed: ", err );
      });

  }

  render() {

    if ( !this.state.network.id ) {
        return ( <div></div> );
    }

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/networks`}>Networks</Link></li>
          <li className="active">{this.state.network.name}</li>
        </ol>
        <div className="panel-body">
          <NetworkForm network={this.state.network} onSubmit={this.onSubmit} update={true}/>
        </div>
      </div>
    );
  }
}

export default NetworkLayout;
