import React, {Component} from "react";
import {Link, withRouter} from 'react-router-dom';

import sessionStore from "../../stores/SessionStore";
import ErrorStore from "../../stores/ErrorStore";
import NetworkSpecificUI from "../NetworkCustomizations/NetworkSpecificUI";
import PropTypes from 'prop-types';

class CreateDeviceProfile extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      deviceProfile: {
        name: "",
        companyId: sessionStore.getUser().companyId,
      },
    };
    this.onSubmit = this.onSubmit.bind(this);

    this.networkTypeLinksComp = {};

  }

  onSubmit = async function(e) {
    e.preventDefault();
    let me = this;

    try {
        if ( me.networkTypeLinksComp.onSubmit ) {
            var ret = await me.networkTypeLinksComp.onSubmit( this.state.deviceProfile.name );
            console.log( "CreateDeviceProfile returns", ret );
        }
        else {
            console.log("No data to update!" );
        }
        this.props.history.push('/applications');
    }
    catch( err ) {
        ErrorStore.createError( err );
    }
  }

  componentWillMount() {

  }

  onChange(field, e) {
    let deviceProfile = this.state.deviceProfile;

    if ( (e.target.type === "number") || (e.target.type === "select-one") ) {
      deviceProfile[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      deviceProfile[field] = e.target.checked;
    } else {
      deviceProfile[field] = e.target.value;
    }
    this.setState({deviceProfile: deviceProfile});
  }

  render() {
    let me = this;

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/applications`}>Create Device Profile</Link></li>
        </ol>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title panel-title-buttons">Create Device Profile</h3>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className="panel-body">
              <div className="form-group">
                <label className="control-label" htmlFor="name">Device Profile Name</label>
                <input className="form-control" id="name" type="text" placeholder="e.g. 'temperature-sensors'" required value={this.state.deviceProfile.name || ''}
                       onChange={this.onChange.bind(this, 'name')}/>
              </div>

              <NetworkSpecificUI
                    ref={ (comp) => { me.networkTypeLinksComp = comp; }}
                    dataName="DeviceProfile"
                    parentDataId={0}
                    referenceDataId={me.state.deviceProfile.companyId}
                    dataRec={me.state.deviceProfile} />

              <hr/>
              <div className="btn-toolbar pull-right">
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </div>
          </form>

        </div>
      </div>
    )
      ;
  }
}

export default withRouter(CreateDeviceProfile);
