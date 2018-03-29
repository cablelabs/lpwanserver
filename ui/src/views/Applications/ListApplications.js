import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import Select from 'react-select';

import Pagination from "../../components/Pagination";
import applicationStore from "../../stores/ApplicationStore";
import companyStore from "../../stores/CompanyStore";
import networkTypeStore from "../../stores/NetworkTypeStore";
import reportingProtocolStore from "../../stores/ReportingProtocolStore";
import sessionStore from "../../stores/SessionStore";
import userStore from "../../stores/UserStore";
import deviceStore from "../../stores/DeviceStore";


class ApplicationRow extends Component {
    constructor( props ) {
        super( props );

        this.toggleRunning = this.toggleRunning.bind( this );
    }

    toggleRunning( running, id ) {
        if ( running ) {
            applicationStore.stopApplication( id );
        }
        else {
            applicationStore.startApplication( id );
        }
        this.props.parentReload();
    }

  render() {
    return (
      <tr>
        <td><Link to={`/applications/${this.props.application.id}`}>{this.props.application.name}</Link></td>
        <td>{this.props.reportingProtocolsMap[this.props.application.reportingProtocolId]}</td>
        <td>{this.props.application.baseUrl}</td>
        <td>{this.props.application.running.toString()}</td>
        <td>
            <div className="btn-group pull-right">
                <button type="button"
                        className="btn btn-default btn-sm"
                        onClick={this.toggleRunning.bind( this, this.props.application.running, this.props.application.id ) }>
                    { this.props.application.running ? "Stop" : "Start" }
                </button>
            </div>
        </td>
        <td className={`${this.props.isGlobalAdmin ? '' : 'hidden'}`}>{this.props.application.companyName}</td>
      </tr>
    );
  }
}

class UserRow extends Component {

  render() {
    let verified = ((this.props.user.emailVerified) ? "True" : "False");
    let email = ((this.props.user.email) ? this.props.user.email : "Unlisted");
    return (
      <tr>
        <td><Link to={`/users/${this.props.user.id}`}>{this.props.user.username}</Link></td>
        <td>{email}</td>
        <td>{verified}</td>
        <td>{this.props.user.role}</td>
        <td className={`${this.props.isGlobalAdmin ? '' : 'hidden'}`}>{this.props.user.companyName}</td>
      </tr>
    );
  }
}

class DeviceProfileRow extends Component {

  render() {
    return (
      <tr>
        <td><Link to={`/deviceProfile/${this.props.deviceProfile.id}`}>{this.props.deviceProfile.name}</Link></td>
        <td className={`${this.props.isGlobalAdmin ? '' : 'hidden'}`}>{this.props.deviceProfile.companyName}</td>
      </tr>
    );
  }
}

class ListApplications extends Component {
  constructor(props) {
      super(props);
      var isGlobalAdmin = sessionStore.isGlobalAdmin();
      var isAdmin = sessionStore.isAdmin();

      this.state = {
          pageSize: 20,
          activeTab: "application",
          networkTypesMap: {},
          reportingProtocolsMap: {},
          applications: [],
          users: [],
          deviceProfiles: [],
          companies: {},
          organization: {},
          isGlobalAdmin: isGlobalAdmin,
          isAdmin: isAdmin,
          appPageNumber: 1,
          appPages: 1,
          userPageNumber: 1,
          userPages: 1,
          dpPageNumber: 1,
          dpPages: 1,
          filterCompanySearch: "",
          filterCompany: isGlobalAdmin ?
                            undefined : sessionStore.getUser().companyId,
          filterList: undefined,
          reloadCount: 0,
      };

      this.updatePage = this.updatePage.bind(this);
      this.changeTab = this.changeTab.bind(this);
      this.reload = this.reload.bind(this);
      this.sessionWatch = this.sessionWatch.bind(this);
      this.reloadBasedOnFilter = this.reloadBasedOnFilter.bind(this);
 }

  changeTab(e) {
    e.preventDefault();
    this.setState({
      activeTab: e.target.getAttribute('aria-controls'),
    });

  }

  sessionWatch() {
    this.setState({
      isGlobalAdmin: sessionStore.isGlobalAdmin(),
    });
  }

  componentWillReceiveProps(nextProps) {

    this.updatePage(nextProps);
  }

  updatePage(props) {
      this.sessionWatch();
  }

  componentDidMount = async function(props) {
      // Check for a user, and redirect to login if none is set.
      let user = sessionStore.getUser();
      if ( !user || !user.id || ( user.id === 0 ) ) {
          this.props.history.push("/login");
          return;
      }

      sessionStore.on("change", this.sessionWatch );

      // Admin?  Needs company list.
      var companies = {};
      var filterList = [];
      if ( this.state.isAdmin ) {
          let recs;
          try {
              let cos = await companyStore.getAll();
              recs = cos.records;
          }
          catch( err ) {
              console.log( "Error getting company selection list:" + err );
              recs = [];
          }
          for( let i = 0; i < recs.length; ++i ) {
              let rec = recs[ i ];
              companies[ rec.id ] = rec;
              filterList.push( { label: rec.name, value: rec.id } );
          }
      }
      this.setState( { companies: companies,
                       filterList: filterList } );

      try {
          let networkTypes = await networkTypeStore.getNetworkTypes();
          let networkTypesMap = {};
          for (let i = 0; i < networkTypes.length; ++i) {
              networkTypesMap[networkTypes[i].id] = networkTypes[i].name;
          }
          this.setState({networkTypesMap: networkTypesMap});
      }
      catch( err ) {
          console.log( "Error getting network types: " + err );
      }

      try {
          let reportingProtocols = await reportingProtocolStore.getReportingProtocols();
          let reportingProtocolsMap = {};
          for (let i = 0; i < reportingProtocols.length; ++i) {
              reportingProtocolsMap[reportingProtocols[i].id] = reportingProtocols[i].name;
          }
          this.setState({reportingProtocolsMap: reportingProtocolsMap});
      }
      catch( err ) {
          console.log( "Error getting reporting protocols: " + err );
      }

      this.reloadBasedOnFilter( );
  }

  reloadBasedOnFilter = async function( ) {
    try {
        let apps = await applicationStore.getAll(
                                this.state.pageSize,
                                (this.state.appPage - 1) * this.state.pageSize,
                                this.state.filterCompany );
        if ( this.state.isGlobalAdmin ) {
            apps.records.forEach( app => {
                app.companyName = this.state.companies[ app.companyId ].name;
            });
        }
        this.setState({
            applications: apps.records,
            appPages: Math.ceil(apps.totalCount / this.state.pageSize),
        });
    }
    catch( err ) {
         console.log( "Error getting applications: " + err );
    }
    window.scrollTo(0, 0);

    try {
        if ( this.state.isAdmin ) {
            let userret = await userStore.getAll(
                                this.state.pageSize,
                                (this.state.userPage - 1) * this.state.pageSize,
                                this.state.filterCompany )
            let users = userret.records;
            for ( let i = 0; i < users.length; ++i ) {
                let u = users[ i ];
                u.companyName = this.state.companies[ u.companyId ].name;
            }
            this.setState({
                users: users,
                userPages: Math.ceil( userret.totalCount / this.state.pageSize),
            });
            window.scrollTo(0, 0);
        }
    }
    catch( err ) {
         console.log( "Error getting users: " + err );
    }

    try {
        let devsret = await deviceStore.getAllDeviceProfiles(
                                this.state.pageSize,
                                (this.state.dpPage - 1) * this.state.pageSize,
                                this.state.filterCompany );
        let deviceProfiles = devsret.records;
        if ( this.state.isGlobalAdmin ) {
            deviceProfiles.forEach( dp => {
                dp.companyName = this.state.companies[ dp.companyId ].name;
            });
        }
        this.setState({
            deviceProfiles: deviceProfiles,
            dpPages: Math.ceil( devsret.totalCount / this.state.pageSize),
        });
        window.scrollTo(0, 0);
    }
    catch( err ) {
         console.log( "Error getting deviceProfiles: " + err );
    }
  }

  componentWillUnmount() {
      sessionStore.removeListener("change", this.sessionWatch );
  }

  applyFilter( e, v ) {
      let value;
      if ( v && null != v ) {
          value = v.value;
      }

      // The callback forces the applications and users to be reloaded
      // based on the filter AFTER the filter is reset.
      this.setState( { filterCompany: value }, this.reloadBasedOnFilter );
  }

  reload(i) {
      let apps = this.state.applications;
      apps[i].running = !apps[i].running;

      this.setState( { applications: apps } );
  }

  render() {
    const ApplicationRows = this.state.applications.map((application, i) =>
        <ApplicationRow key={application.id}
                        parentReload={() => this.reload(i)}
                        application={application}
                        isGlobalAdmin={this.state.isGlobalAdmin}
                        networkTypesMap={this.state.networkTypesMap}
                        reportingProtocolsMap={this.state.reportingProtocolsMap}
                        />);
    const UserRows = this.state.users.map((user, i) =>
        <UserRow key={user.id}
                 user={user}
                 isGlobalAdmin={this.state.isGlobalAdmin} />);
    const DeviceProfileRows = this.state.deviceProfiles.map((dp, i) =>
        <DeviceProfileRow key={dp.id}
                          deviceProfile={dp}
                          isGlobalAdmin={this.state.isGlobalAdmin} />);

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
        </ol>


        <div className="panel panel-default">

          <div className={`panel-heading clearfix `}>

            <div className={`btn-group pull-right ${this.state.activeTab === "application" ? '' : 'hidden'}`}>
              <Link to={`/create/application`}>
                <button type="button" className="btn btn-default btn-sm">Create Application</button>
              </Link>
            </div>

            <div className={`btn-group pull-right ${this.state.activeTab === "users" ? '' : 'hidden'}`}>
              <Link to={`/create/user`}>
                <button type="button" className="btn btn-default btn-sm">Create User</button>
              </Link>
            </div>

            <div className={`btn-group pull-right ${this.state.activeTab === "deviceProfiles" ? '' : 'hidden'}`}>
              <Link to={`/create/deviceProfile`}>
                <button type="button" className="btn btn-default btn-sm">Create Device Profile</button>
              </Link>
            </div>

            <ul className="nav nav-tabs">
              <li role="presentation" className={(this.state.activeTab === "application" ? 'active' : '')}><a
                onClick={this.changeTab} href="#application" aria-controls="application">Applications</a></li>
              <li role="presentation" className={(this.state.activeTab === "users" ? 'active' : '') + ((sessionStore.isAdmin()) ? '' : ' hidden' ) }><a
                onClick={this.changeTab} href="#users" aria-controls="users">Users</a></li>
              <li role="presentation" className={(this.state.activeTab === "deviceProfiles" ? 'active' : '')}><a
                onClick={this.changeTab} href="#deviceProfiles" aria-controls="deviceProfiles">Device Profiles</a></li>
            </ul>
          </div>

          <div className={`panel-body clearfix ${this.state.isGlobalAdmin ? '' : 'hidden'}`}>
              <form onSubmit={this.applyFilter.bind(this)}>
                  <div className="form-group">
                      <Select
                          value={this.state.filterCompany}
                          options={this.state.filterList}
                          onChange={this.applyFilter.bind( this, "filter" )}
                          placeholder="Filter list by company..." />
                  </div>
              </form>

          </div>

          <div className={`panel-body clearfix ${this.state.activeTab === "application" ? '' : 'hidden'}`}>
            <table className="table table-hover">
              <thead>
              <tr>
                <th className="col-md-3">Name</th>
                <th className="col-md-3">Reporting Protocol</th>
                <th className="col-md-3">To URL</th>
                <th className="col-md-1">Running?</th>
                <th className="col-md-1">Start/Stop</th>
                <th className={`col-md-3 ${this.state.isGlobalAdmin ? '' : 'hidden'}`}>Company</th>
              </tr>
              </thead>
              <tbody>
              {ApplicationRows}
              </tbody>
            </table>
            <Pagination pages={this.state.appPages}
                        currentPage={this.state.appPageNumber}
                        pathname={`/applications`}/>
          </div>

          <div className={`panel-body clearfix ${this.state.activeTab === "users" ? '' : 'hidden'}`}>
            <table className="table table-hover">
              <thead>
              <tr>
                <th className="col-md-3">User Name</th>
                <th className="col-md-3">Email</th>
                <th className="col-md-2">Verified Email</th>
                <th className="col-md-1">Role</th>
                <th className={`col-md-3 ${this.state.isGlobalAdmin ? '' : 'hidden'}`}>Company</th>
              </tr>
              </thead>
              <tbody>
              {UserRows}
              </tbody>
            </table>
            <Pagination pages={this.state.userPages}
                        currentPage={this.state.userPageNumber}
                        pathname={`/applications`}/>
          </div>

          <div className={`panel-body clearfix ${this.state.activeTab === "deviceProfiles" ? '' : 'hidden'}`}>
            <table className="table table-hover">
              <thead>
              <tr>
                <th className="col-md-6">Device Profile Name</th>
                <th className={`col-md-3 ${this.state.isGlobalAdmin ? '' : 'hidden'}`}>Company</th>
              </tr>
              </thead>
              <tbody>
              {DeviceProfileRows}
              </tbody>
            </table>
            <Pagination pages={this.state.dpPages}
                        currentPage={this.state.dpPageNumber}
                        pathname={`/applications`}/>
          </div>

        </div>
      </div>
    );
  }
}

//
export default ListApplications;
