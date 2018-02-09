import React, {Component} from "react";
import {/*Route,*/ Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import sessionStore from "../../stores/SessionStore";
import deviceStore from "../../stores/DeviceStore";
import applicationStore from "../../stores/ApplicationStore";
import DeviceForm from "../../components/DeviceForm";


class DeviceLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();

    this.state = {
      application: {},
      device: {},
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
      applicationStore.getApplication(this.props.match.params.applicationID)
      .then( (application) => {
          this.setState({application: application});
      });

      deviceStore.getDevice(this.props.match.params.deviceID)
      .then( (device) => {
          this.setState({device: (device)});
      });

      sessionStore.on("change", this.sessionChange );
  }

  componentWillUnmount() {
       sessionStore.removeListener("change", this.sessionChange );
  }

  onDelete() {
  }

  render() {
      let page = 1;
      if (this.props.history.location.state !== undefined)
        page = this.props.history.location.state.page;
      return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/Applications`}>Applications</Link></li>
          <li><Link to={`/Applications/${this.state.application.id}`}>{this.state.application.name}</Link></li>
          <li className="active">{this.state.device.name}</li>

        </ol>
        <div className="panel-body">
          <DeviceForm device={this.state.device} onSubmit={this.onSubmit} update={true} page={page}/>
        </div>
      </div>
    );
  }
}

export default DeviceLayout;
