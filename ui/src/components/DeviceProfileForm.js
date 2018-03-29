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
      try {
          var me = this;
          e.preventDefault();
          if ( me.networkTypeLinksComp.onSubmit ) {
              await me.networkTypeLinksComp.onSubmit();
          }
          else {
              console.log("No data to update!" );
          }

          me.props.history.push('/applications');
      }
      catch( err ) {
          console.log( "Error updating deviceProfile" , err );
      }
  }

  componentWillReceiveProps(nextProps) {
    this.updatePage(nextProps);
  }

  updatePage(props) {
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
              <button type="button" className="btn btn-danger btn-sm" onClick={me.onDelete}>Delete Device Profile
              </button>
            </div>

        </div>


        <form onSubmit={me.handleSubmit}>
            <div className="form-group">
              <label className="control-label" htmlFor="name">Device Profile Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     placeholder="e.g. 'temperature-sensors'"
                     required
                     value={me.state.deviceProfile.name || ''} onChange={me.onChange.bind(me, 'name')}/>
            </div>

            <div className="form-group">
              <label className="control-label" htmlFor="description">Device Profile Description</label>
              <input className="form-control"
                     id="description"
                     type="text"
                     placeholder="e.g. 'IoT-Co LoRa temperature sensors'"
                     required
                     value={me.state.deviceProfile.description || ''} onChange={me.onChange.bind(me, 'description')}/>
            </div>

            <NetworkSpecificUI
                  ref={ (comp) => { me.networkTypeLinksComp = comp; }}
                  dataName="DeviceProfile"
                  referenceDataId={me.state.deviceProfile.companyId}
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
