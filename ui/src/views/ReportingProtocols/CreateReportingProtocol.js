import React, {Component} from "react";
import {Link, withRouter} from 'react-router-dom';

import reportingProtocolStore from "../../stores/ReportingProtocolStore";
import PropTypes from 'prop-types';


class CreateReportingProtocol extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      reportingProtocol: {},
      reportingProtocolHandlers: []

    };

    reportingProtocolStore.getReportingProtocolHandlers()
      .then((response) => {
        //Add a none selected place holder
        let temp = [{id: '', name: 'No Handler Selected'}];
        temp = temp.concat(response);
        this.setState({
          reportingProtocolHandlers: temp,
        });
      });

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(e) {
    e.preventDefault();
    reportingProtocolStore.createReportingProtocol(
                                    this.state.reportingProtocol.name,
                                    this.state.reportingProtocol.protocolHandler )
    .then( (responseData) => {
      this.props.history.push('/admin/reportingProtocols');
    })
    .catch( err => {
        console.log( "Create ReportingProtocol failed:", err );
    });
  }

  componentWillMount() {

  }

  onChange(field, e) {
    let reportingProtocol = this.state.reportingProtocol;
    if (field === 'protocolHandler') {
      reportingProtocol[field] = e.target.value;
    }
    else if ( (e.target.type === "number") || (e.target.type === "select-one") ) {
      reportingProtocol[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      reportingProtocol[field] = e.target.checked;
    } else {
      reportingProtocol[field] = e.target.value;
    }
    this.setState({reportingProtocol: reportingProtocol});
  }

  render() {
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/reportingProtocols`}>Reporting Protocols</Link></li>
          <li className="active">Create Reporting Protocol</li>
        </ol>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title panel-title-buttons">Create Reporting Protocol</h3>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className="panel-body">
            <div className="form-group">
              <label className="control-label" htmlFor="name">Reporting Protocol Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     placeholder="e.g. 'POST'"
                     required
                     value={this.state.reportingProtocol.name || ''}
                     onChange={this.onChange.bind(this, 'name')}/>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="protocolHandler">Reporting Protocol Handler</label>
              <select className="form-control"
                      id="protocolHandler"
                      required
                      value={this.state.reportingProtocol.protocolHandler}
                      onChange={this.onChange.bind(this, 'protocolHandler')}>
                {this.state.reportingProtocolHandlers.map( protocol => <option value={protocol.id} key={"typeSelector" + protocol.id }>{protocol.name}</option>)}
              </select>
              <p className="help-block">
                Specifies the name of the file on the REST Server that handles
                the passing of data back to the application vendor.
              </p>
            </div>

              <div className="btn-toolbar pull-right">
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </div>
          </form>

        </div>
      </div>
    );
  }
}

export default withRouter(CreateReportingProtocol);
