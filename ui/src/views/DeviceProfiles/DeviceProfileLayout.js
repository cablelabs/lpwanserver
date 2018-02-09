import React, {Component} from "react";
import {/*Route,*/ Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import sessionStore from "../../stores/SessionStore";
import deviceStore from "../../stores/DeviceStore";
import DeviceProfileForm from "../../components/DeviceProfileForm";


class DeviceProfileLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      deviceProfile: {},
      isAdmin: sessionStore.isAdmin(),
    };

    this.onDelete = this.onDelete.bind(this);

  }

  sessionChange() {
    this.setState({
      isAdmin: (sessionStore.isAdmin())
    });
  }

  componentDidMount() {
    deviceStore.getDeviceProfile( this.props.match.params.deviceProfileID )
    .then( (deviceProfile) => {
        console.log( "Set device profile: ", deviceProfile );
        this.setState({deviceProfile: deviceProfile});
    })
    .catch( ( err ) => {
        console.log( "Device profile retrieve error: " + err );
    });

    this.sessionChange();

    sessionStore.on("change", this.sessionChange );
  }

  componentWillUnmount() {
       sessionStore.removeListener("change", this.sessionChange );
  }

  onDelete() {

  }

  render() {
console.log( "Device profile layout render" );
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/applications`}>Applications</Link></li>
          <li><Link to={`/applications`}>Device Profiles</Link></li>
          <li className="active">{this.state.deviceProfile.name}</li>
        </ol>
        <div className="panel-body">
          <DeviceProfileForm deviceProfile={this.state.deviceProfile} onSubmit={this.onSubmit} update={true}/>
        </div>
      </div>
    );
  }
}

export default DeviceProfileLayout;
