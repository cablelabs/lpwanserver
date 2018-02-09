import React, {Component} from 'react';


import SessionStore from "../stores/SessionStore";
import deviceStore from "../stores/DeviceStore";
import NetworkSpecificUI from "../views/NetworkCustomizations/NetworkSpecificUI";
import '../index.css';
import {withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';


class DeviceProfileForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      deviceProfile: {},
      isGlobalAdmin: false,
    };

    this.networkTypeLinksComp = {};

    this.updatePage = this.updatePage.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.sessionChange = this.sessionChange.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);

  }

  sessionChange() {
      this.setState({
          isGlobalAdmin: SessionStore.isGlobalAdmin(),
      });
  }

  componentDidMount() {
      console.log( this.props );
    this.setState({
      deviceProfile: this.props.deviceProfile,
    });

    SessionStore.on("change", this.sessionChange );

    this.updatePage(this.props);

  }

  componentWillUnmount() {
      SessionStore.removeListener("change", this.sessionChange );
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


  handleSubmit = async function(e) {
      e.preventDefault();
      var me = this;
      try {
          if ( me.networkTypeLinksComp.onSubmit ) {
              var ret = await me.networkTypeLinksComp.onSubmit();
              console.log( "Device Profile Form update returns", ret );
          }
          else {
              console.log("No data to update!" );
          }
      }
      catch( err ) {
          console.log( "Error updating deviceProfile" , err );
      }

      me.props.history.push('/applications');
  }

  componentWillReceiveProps(nextProps) {
    this.updatePage(nextProps);
  }

  updatePage(props) {
      console.log( props );
    this.setState({
      deviceProfile: props.deviceProfile,
      pageNumber: props.page,
    });

  }

  onDelete() {
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this device profile?")) {
      deviceStore.deleteDeviceProfile(this.state.deviceProfile.id )
      .then((responseData) => {
          this.props.history.push('/applications');
      })
      .catch( ( err ) => {
          console.log( "Error deleting device profile", err );
      });
    }
  }


  render() {
    if ( !this.state.deviceProfile ||
         !this.state.deviceProfile.id ) {
        return ( <div></div> );
    }

    let me = this;

    return (

      <div>
        <div className="btn-group pull-right">

            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Device Profile
              </button>
            </div>

        </div>


        <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label className="control-label" htmlFor="name">Device Profile Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     placeholder="e.g. 'temperature-sensors'"
                     required
                     value={this.state.deviceProfile.name || ''} onChange={this.onChange.bind(this, 'name')}/>
            </div>

            <NetworkSpecificUI
                  ref={ (comp) => { me.networkTypeLinksComp = comp; }}
                  dataName="DeviceProfile"
                  referenceDataId={this.state.deviceProfile.companyId}
                  dataRec={me.state.deviceProfile} />

            <hr/>
            <div className="btn-toolbar pull-right">
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>

        </form>
      </div>
    );
  }
}

export default withRouter(DeviceProfileForm);
