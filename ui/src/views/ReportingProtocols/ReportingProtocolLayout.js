import React, {Component} from "react";
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import sessionStore from "../../stores/SessionStore";
import reportingProtocolStore from "../../stores/ReportingProtocolStore";
import ReportingProtocolForm from "../../components/ReportingProtocolForm";


class ReportingProtocolLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      reportingProtocol: {},
      isGlobalAdmin: sessionStore.isGlobalAdmin(),
    };

    sessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: (sessionStore.isGlobalAdmin())
      });
    });

    reportingProtocolStore.getReportingProtocol( props.match.params.reportingProtocolID ).then( (reportingProtocol) => {
        this.setState( { reportingProtocol: reportingProtocol } );
    })
    .catch( ( err ) => { this.props.history.push('/admin/reportingProtocols'); });

    this.onSubmit = this.onSubmit.bind(this);
  }

    onSubmit() {
      reportingProtocolStore.updateReportingProtocol( this.state.reportingProtocol ).then( (data) => {
        this.props.history.push('/admin/reportingProtocols');
      })
      .catch( (err) => {
          console.log( "ReportingProtocol update failed: ", err );
      });

  }

  render() {

    if ( !this.state.reportingProtocol.id ) {
        return ( <div></div> );
    }

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/reportingProtocols`}>Reporting Protocols</Link></li>
          <li className="active">{this.state.reportingProtocol.name}</li>
        </ol>
        <div className="panel-body">
          <ReportingProtocolForm reportingProtocol={this.state.reportingProtocol} onSubmit={this.onSubmit} update={true}/>
        </div>
      </div>
    );
  }
}

export default ReportingProtocolLayout;
