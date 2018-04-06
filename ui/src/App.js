import React, {Component} from 'react';
import Navbar from "./components/Navbar";

import dispatcher from "./dispatcher";
import {Route} from 'react-router-dom';

import Login from "./views/auth/Login";
import ApplicationLayout from "./views/Applications/ApplicationLayout";
import UpdateUser from "./views/Applications/UpdateUser";
import DeviceLayout from "./views/Devices/DeviceLayout";
import ListApplications from "./views/Applications/ListApplications";
import CreateApplication from "./views/Applications/CreateApplication";
import CreateDevice from "./views/Devices/CreateDevice";
import Errors from "./components/Errors";
import CreateUser from "./views/auth/CreateUser";
import ListCompanies from "./views/Companies/ListCompanies";
import CompanyLayout from "./views/Companies/CompanyLayout";
import CreateCompany from "./views/Companies/CreateCompany";
import ListNetworkTypes from "./views/NetworkTypes/ListNetworkTypes";
import NetworkTypeLayout from "./views/NetworkTypes/NetworkTypeLayout";
import CreateNetworkType from "./views/NetworkTypes/CreateNetworkType";
import ListNetworkProviders from "./views/NetworkProviders/ListNetworkProviders";
import NetworkProviderLayout from "./views/NetworkProviders/NetworkProviderLayout";
import CreateNetworkProvider from "./views/NetworkProviders/CreateNetworkProvider";
import ListNetworkProtocols from "./views/NetworkProtocols/ListNetworkProtocols";
import NetworkProtocolLayout from "./views/NetworkProtocols/NetworkProtocolLayout";
import CreateNetworkProtocol from "./views/NetworkProtocols/CreateNetworkProtocol";
import ListNetworks from "./views/Networks/ListNetworks";
import NetworkLayout from "./views/Networks/NetworkLayout";
import CreateNetwork from "./views/Networks/CreateNetwork";
import ListReportingProtocols from "./views/ReportingProtocols/ListReportingProtocols";
import ReportingProtocolLayout from "./views/ReportingProtocols/ReportingProtocolLayout";
import CreateReportingProtocol from "./views/ReportingProtocols/CreateReportingProtocol";
import CreateDeviceProfile from "./views/DeviceProfiles/CreateDeviceProfile";
import DeviceProfileLayout from "./views/DeviceProfiles/DeviceProfileLayout";
import ErrorStore from "./stores/ErrorStore";
import PullNetworks from "./views/ImportExport/PullNetworks";
//import ApplicationStore from "./stores/ApplicationStore";

// styling
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-light.css';

class Layout extends Component {
  onClick() {
    dispatcher.dispatch({
      type: "BODY_CLICK",
    });
  }

  componentDidMount() {
      ErrorStore.clear();
  }

  render() {
    return (
      <div>
        <Navbar/>
        <div className="container" onClick={this.onClick}>
          <div className="row">
            <Errors/>
            <Route exact path="/login" component={Login}/>
            <Route exact path="/" component={ListApplications}/>
            <Route exact path="/applications" component={ListApplications}/>
            <Route exact path="/applications/:applicationID" component={ApplicationLayout}/>
            <Route exact path="/users" component={ListApplications}/>
            <Route exact path="/users/:userID" component={UpdateUser}/>
            <Route exact path="/create/application" component={CreateApplication}/>
            <Route exact path="/create/user" component={CreateUser}/>
            <Route exact path="/create/application/:applicationID/device" component={CreateDevice}/>
            <Route exact path="/applications/:applicationID/devices/:deviceID" component={DeviceLayout}/>
            <Route exact path="/admin/company/:companyID" component={CompanyLayout}/>
            <Route exact path="/admin/companies" component={ListCompanies}/>
            <Route exact path="/admin/company" component={CreateCompany}/>
            <Route exact path="/admin/networkType/:networkTypeID" component={NetworkTypeLayout}/>
            <Route exact path="/admin/networkTypes" component={ListNetworkTypes}/>
            <Route exact path="/admin/networkType" component={CreateNetworkType}/>
            <Route exact path="/admin/networkProvider/:networkProviderID" component={NetworkProviderLayout}/>
            <Route exact path="/admin/networkProviders" component={ListNetworkProviders}/>
            <Route exact path="/admin/networkProvider" component={CreateNetworkProvider}/>
            <Route exact path="/admin/networkProtocol/:networkProtocolID" component={NetworkProtocolLayout}/>
            <Route exact path="/admin/networkProtocols" component={ListNetworkProtocols}/>
            <Route exact path="/admin/networkProtocol" component={CreateNetworkProtocol}/>
            <Route exact path="/admin/network/:networkID" component={NetworkLayout}/>
            <Route exact path="/admin/networks" component={ListNetworks}/>
            <Route exact path="/admin/network" component={CreateNetwork}/>
            <Route exact path="/admin/pull/:networkID" component={PullNetworks}/>
            <Route exact path="/admin/reportingProtocol/:reportingProtocolID" component={ReportingProtocolLayout}/>
            <Route exact path="/admin/reportingProtocols" component={ListReportingProtocols}/>
            <Route exact path="/admin/reportingProtocol" component={CreateReportingProtocol}/>
            <Route exact path="/create/deviceProfile" component={CreateDeviceProfile}/>
            <Route exact path="/deviceProfile/:deviceProfileID" component={DeviceProfileLayout}/>
          </div>
        </div>
      </div>
    );
  }
}

//<Route exact path="/applications" component={ApplicationLayout
///applications/:applicationID
//<Errors />
//
export default Layout;
