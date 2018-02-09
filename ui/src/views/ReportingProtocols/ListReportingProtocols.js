import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import reportingProtocolStore from "../../stores/ReportingProtocolStore";
import SessionStore from "../../stores/SessionStore";

class ReportingProtocolRow extends Component {
  render() {
    return (
      <tr>
        <td><Link to={`/admin/reportingProtocol/${this.props.reportingProtocol.id}`}>{this.props.reportingProtocol.name}</Link></td>
      </tr>
    );
  }
}

class ListReportingProtocols extends Component {
  constructor() {
    super();

    this.state = {
      reportingProtocols: [],
      isGlobalAdmin: false,
    };

    this.updatePage = this.updatePage.bind(this);
    this.listenForSessionChange = this.listenForSessionChange.bind(this);

  }

  listenForSessionChange() {
    this.setState({
      isGlobalAdmin: SessionStore.isGlobalAdmin(),
    });
  }

  componentDidMount() {
    this.updatePage(this.props);

    SessionStore.on("change", this.listenForSessionChange );
  }

  componentWillUnmount() {
    SessionStore.removeListener("change", this.listenForSessionChange );
  }

  componentWillReceiveProps(nextProps) {

    this.updatePage(nextProps);
  }

  updatePage(props) {
    reportingProtocolStore.getReportingProtocols()
    .then( reportingProtocols => {
        console.log( "Got reportingProtocols", reportingProtocols );
        this.setState({reportingProtocols: reportingProtocols});
        window.scrollTo(0, 0);
    });

  }

  render() {
    const ReportingProtocolRows = this.state.reportingProtocols.map((reportingProtocol) =>
        <ReportingProtocolRow key={reportingProtocol.id}
                              reportingProtocol={reportingProtocol} />);

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
            <li><Link to={`/admin/reportingProtocols`}>Reporting Protocols</Link></li>
        </ol>

        <div className="panel panel-default">



          <div className={`panel-heading clearfix `}>
            Reporting Protocols define the way we pass data back to a vendor application.<br/>
            <strong>Changes here MUST be coordinated with code changes on the REST Server.</strong>
            <div className={`btn-group pull-right`}>
              <Link to={`/admin/reportingProtocol`}>
                <button type="button" className="btn btn-default btn-sm">Create Reporting Protocol</button>
              </Link>
            </div>

          </div>

          <div className={`panel-body clearfix `}>
            <table className="table table-hover">
              <thead>
              <tr>
                <th className="col-md-4">Name</th>
              </tr>
              </thead>
              <tbody>
              {ReportingProtocolRows}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    );
  }
}

//
export default ListReportingProtocols;
