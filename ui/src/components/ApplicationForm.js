import React, {Component} from 'react';


import SessionStore from "../stores/SessionStore";
import applicationStore from "../stores/ApplicationStore";
import deviceStore from "../stores/DeviceStore";
import reportingProtocolStore from "../stores/ReportingProtocolStore";
import NetworkSpecificUI from "../views/NetworkCustomizations/NetworkSpecificUI";
import '../index.css';
import {Link, withRouter} from 'react-router-dom';
import Pagination from "../components/Pagination";
import PropTypes from 'prop-types';


class DeviceRow extends Component {

  render() {
    return (
      <tr>
        <td><Link
          to={`/applications/${this.props.appID}/devices/${this.props.device.id}`}>{this.props.device.name}</Link></td>
        <td>{this.props.device.deviceModel}</td>
      </tr>
    );
  }
}

class ApplicationForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      activeTab: "devices",
      application: {},
      isGlobalAdmin: false,
      pageSize: 20,
      pageNumber: 1,
      pages: 1,
      devices: [],
      reportingProtocols: [],
    };

    this.networkTypeLinksComp = {};

    this.updatePage = this.updatePage.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.changeTab = this.changeTab.bind(this);
    this.sessionChange = this.sessionChange.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);

    reportingProtocolStore.getReportingProtocols()
    .then( response => {
        this.setState( { reportingProtocols: response } );
    });
  }

  sessionChange() {
      this.setState({
          isGlobalAdmin: SessionStore.isGlobalAdmin(),
      });
  }

  componentDidMount() {
    this.setState({
      application: this.props.application,
    });

    SessionStore.on("change", this.sessionChange );

    this.updatePage(this.props);

  }

  componentWillUnmount() {
      SessionStore.removeListener("change", this.sessionChange );
  }

  onChange(field, e) {
    let application = this.state.application;

    if ( (e.target.type === "number") || (e.target.type === "select-one") ) {
      application[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      application[field] = e.target.checked;
    } else {
      application[field] = e.target.value;
    }
    this.setState({application: application});
  }


  handleSubmit = async function(e) {
      e.preventDefault();
      var me = this;
      try {
          await applicationStore.updateApplication( this.state.application );
          if ( me.networkTypeLinksComp.onSubmit ) {
              var ret = await me.networkTypeLinksComp.onSubmit();
              console.log( "ApplicatonForm update returns", ret );
          }
          else {
              console.log("No data to update!" );
          }
      }
      catch( err ) {
          console.log( "Error updating application" , err );
      }

      me.props.history.push('/applications');
  }

  componentWillReceiveProps(nextProps) {
    this.updatePage(nextProps);
  }

  getDevices() {
    const page = this.state.pageNumber;
    if ( !this.state.application ||
         !this.state.application.id ) {
        // No basis yet, skip for now.
        return;
    }
    deviceStore.getAll( this.state.pageSize, (page - 1) * this.state.pageSize, this.props.application.id ).then( (response) => {
      this.setState({
        devices: response.records,
        pages: Math.ceil(response.totalCount / this.state.pageSize),
      });
      window.scrollTo(0, 0);
    });
  }

  updatePage(props) {
    this.setState({
      application: props.application,
      pageNumber: props.page,
    }, (prevState, props) => this.getDevices());

  }

  changeTab(e) {
    e.preventDefault();
    this.setState({
      activeTab: e.target.getAttribute('aria-controls'),
    });
    this.getDevices();
  }

  onDelete() {
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this application?")) {
      applicationStore.deleteApplication(this.state.application.id )
      .then((responseData) => {
          this.props.history.push('/applications');
      })
      .catch( ( err ) => {
          console.log( "Error deleting application", err );
      });
    }
  }


  render() {
    let message = {};
    var appid = 0;
    if ( this.state.application &&
         this.state.application.id ) {
        appid = this.state.application.id;
    }
    else {
        return ( <div></div> );
    }

    message[appid] = {};
    message[appid]["DevEUI"] = "BE7A000000000104";
    message[appid]["DevName"] = "unknown";
    message[appid]["AppType"] = 1;
    message[appid]["SeqNum"] = 0;
    message[appid]["TimeStamp"] = 149391448087;
    message[appid]["SensorData"] = "FFFFFFFF";

    const DeviceRows = this.state.devices.map((device, i) => <DeviceRow key={device.id} device={device} appID={appid}/>);

    let me = this;

    //Add test back in when available
    //<li role="presentation" className={(this.state.activeTab === "test-application" ? 'active' : '')}><a onClick={this.changeTab} href="#test-application" aria-controls="test-application">Test Application</a></li>
    return (

      <div>
        <div className="btn-group pull-right">

          <div className={(this.state.activeTab === "application" ? '' : 'hidden')}>

            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Application
              </button>
            </div>
          </div>

          <div className={(this.state.activeTab === "devices" ? '' : 'hidden')}>

            <Link to={`/create/application/${this.state.application.id}/device`}>
              <button type="button" className="btn btn-default btn-sm">Create Device</button>
            </Link>
          </div>
        </div>

        <ul className="nav nav-tabs">
          <li role="presentation" className={(this.state.activeTab === "devices" ? 'active' : '')}><a
            onClick={this.changeTab} href="#devices" aria-controls="devices">Devices</a></li>
          <li role="presentation" className={(this.state.activeTab === "application" ? 'active' : '')}><a
            onClick={this.changeTab} href="#application" aria-controls="application">Application details</a></li>
        </ul>

        <hr/>
        <form onSubmit={this.handleSubmit}>
          <div className={(this.state.activeTab === "application" ? '' : 'hidden')}>
            <div className="form-group">
              <label className="control-label" htmlFor="name">Application Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     placeholder="e.g. 'temperature-sensor'"
                     required
                     value={this.state.application.name || ''} onChange={this.onChange.bind(this, 'name')}/>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="description">Application Description</label>
              <input className="form-control"
                     id="description"
                     type="text"
                     placeholder="e.g. 'Track temperature app'"
                     required
                     value={this.state.application.description || ''} onChange={this.onChange.bind(this, 'description')}/>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="baseUrl">Post URL</label>
              <input className="form-control"
                     id="baseUrl"
                     type="text"
                     placeholder="URL to send sensor data to"
                     required
                     value={this.state.application.baseUrl || ''} onChange={this.onChange.bind(this, 'baseUrl')}/>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="reportingProtocolId">Reporting Protocol</label>
              <select className="form-control"
                      id="reportingProtocolId"
                      required
                      value={this.state.reportingProtocolId}
                      onChange={this.onChange.bind(this, 'reportingProtocolId')}>
                {this.state.reportingProtocols.map( rprot => <option value={rprot.id} key={"typeSelector" + rprot.id }>{rprot.name}</option>)}
              </select>
              <p className="help-block">
                Specifies the Network Protocol that this application will use
                to communicate with the remote network.  The selections here
                are limited by the choice of the network type above.
              </p>
            </div>

            <NetworkSpecificUI
                  ref={ (comp) => { me.networkTypeLinksComp = comp; }}
                  dataName="Application"
                  referenceDataId={this.state.application.companyId}
                  dataRec={me.state.application} />

            <hr/>
            <div className="btn-toolbar pull-right">
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>


          </div>

          <div className={(this.state.activeTab === "devices" ? '' : 'hidden')}>

            <div className="panel-body">
              <table className="table table-hover">
                <thead>
                <tr>
                  <th className="col-md-4">Device ID</th>
                  <th className="col-md-3">Model</th>

                </tr>
                </thead>
                <tbody>
                {DeviceRows}
                </tbody>
              </table>
            </div>
            <Pagination pages={this.state.pages} currentPage={this.state.pageNumber}
                        pathname={`/applications/${this.state.application.id}`}/>


          </div>

          <div className={(this.state.activeTab === "test-application" ? '' : 'hidden')}>

            <div className={"form-group"}>
              <label className="control-label" htmlFor="name">Payload</label>
              <p/>
              <textarea rows="10" cols="50" defaultValue={JSON.stringify(message, null, 4)}/>
            </div>

            <hr/>
            <div className="btn-toolbar pull-right">
              <button type="test" className="btn btn-primary">Test</button>
            </div>

          </div>


        </form>
      </div>
    );
  }
}

export default withRouter(ApplicationForm);
