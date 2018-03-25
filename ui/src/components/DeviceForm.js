import React, {Component} from 'react';


import SessionStore from "../stores/SessionStore";
import deviceStore from "../stores/DeviceStore";
import NetworkSpecificUI from "../views/NetworkCustomizations/NetworkSpecificUI";
import '../index.css';
import {withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';


class DeviceForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      device: {},
      applicationId: props.match.params.applicationID,
      isGlobalAdmin: false,
    };

        this.networkSpecificComps = {};

        this.onDelete = this.onDelete.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
  }

  sessionChange() {
      this.setState({
          isGlobalAdmin: SessionStore.isGlobalAdmin(),
      });
  }

  componentDidMount() {
    this.setState({
      device: this.props.device,
    });

    SessionStore.on("change", this.sessionChange );

    this.updatePage(this.props);

  }

  componentWillUnmount() {
      SessionStore.removeListener("change", this.sessionChange );
  }

  onChange(field, e) {
    let device = this.state.device;

    if ( (e.target.type === "number") || (e.target.type === "select-one") ) {
      device[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      device[field] = e.target.checked;
    } else {
      device[field] = e.target.value;
    }
    this.setState({device: device});
  }


  handleSubmit = async function(e) {
      e.preventDefault();
      var me = this;
      try {
          await deviceStore.updateDevice( this.state.device );
          if ( me.networkTypeLinksComp.onSubmit ) {
              var ret = await me.networkTypeLinksComp.onSubmit();
              console.log( "DeviceForm update returns", ret );
          }
          else {
              console.log("No data to update!" );
          }
      }
      catch( err ) {
          console.log( "Error updating device" , err );
      }

      me.props.history.push('/applications/' +
          this.props.match.params.applicationID );
  }

  componentWillReceiveProps(nextProps) {
    this.updatePage(nextProps);
  }

  updatePage(props) {
    this.setState({
      device: props.device,
      pageNumber: props.page,
    });

  }

  onDelete() {
      //eslint-disable-next-line
      if ( confirm("Are you sure you want to delete this device?") ) {
          deviceStore.deleteDevice( this.state.device.id )
          .then((responseData) => {
              this.props.history.push( '/applications/' +
                                       this.props.match.params.applicationID);
          })
          .catch( ( err ) => {
              console.log( "Error deleting device", err );
          });
      }
  }


  render() {
    if ( !this.state.device ||
         !this.state.device.id ) {
        return ( <div></div> );
    }

    let me = this;

    return (

      <div>
        <div className="btn-group pull-right">

          <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Device
              </button>
          </div>
        </div>
          <form onSubmit={this.handleSubmit}>
            <div className="panel-body">
                <div className="form-group">
                    <label className="control-label" htmlFor="name">Device Name</label>
                    <input className="form-control"
                           id="name"
                           type="text"
                           placeholder="e.g. 'Weather Station 1'"
                           required
                           value={this.state.device.name || ''}
                           onChange={this.onChange.bind(this, 'name')}/>

                </div>
                <div className="form-group">
                    <label className="control-label" htmlFor="description">Device Description</label>
                    <input className="form-control"
                           id="description"
                           type="text"
                           placeholder="e.g. 'Station on the roof'"
                           required
                           value={this.state.device.description || ''}
                           onChange={this.onChange.bind(this, 'description')}/>

                </div>
                <div className="form-group">
                    <label className="control-label" htmlFor="deviceModel">Device Model</label>
                    <input className="form-control"
                           id="deviceModel"
                           type="text"
                           placeholder="e.g. 'Release 1'"
                           required
                           value={this.state.device.deviceModel || ''}
                           onChange={this.onChange.bind(this, 'deviceModel')}/>
                </div>

                <NetworkSpecificUI
                      ref={ (comp) => { me.networkTypeLinksComp = comp; }}
                      dataName="Device"
                      referenceDataId={this.state.device.applicationId}
                      dataRec={me.state.device} />

                <hr/>
                <div className="btn-toolbar pull-right">
                    <button type="submit" className="btn btn-primary">Submit</button>
                </div>
            </div>
        </form>
      </div>
    );
  }
}

export default withRouter(DeviceForm);
