import React, {Component} from 'react';


import SessionStore from "../stores/SessionStore";
import reportingProtocolStore from "../stores/ReportingProtocolStore";
import '../index.css';
import {withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';


class ReportingProtocolForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      reportingProtocol: props.reportingProtocol,
      reportingProtocolHandlers: [],
      isGlobalAdmin: SessionStore.isAdmin(),
    }

    reportingProtocolStore.getReportingProtocolHandlers()
      .then((response) => {
        //Add a none selected place holder
        let temp = [{id: '', name: 'No Handler Selected'}];
        temp = temp.concat(response);
        this.setState({
          reportingProtocolHandlers: temp,
        });
      });

    this.componentWillMount = this.componentWillMount.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  componentWillMount() {
    SessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: SessionStore.isAdmin(),
      });
    });
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

  onDelete(e) {
      e.preventDefault();
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this network type?")) {
      reportingProtocolStore.deleteReportingProtocol(this.state.reportingProtocol.id ).then( (responseData) => {
        this.props.history.push('/admin/reportingProtocols');
      })
      .catch( (err) => { console.log( "Delete failed:" + err ); } );
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state.reportingProtocol);
  }



  render() {
    if ( !this.state.reportingProtocol ||
         !this.state.reportingProtocol.id ) {
        return ( <div></div> );
    }

    return (

      <div>
        <div className="btn-group pull-right">
            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Reporting Protocol
              </button>
            </div>
        </div>

        <hr/>
        <form onSubmit={this.handleSubmit}>
          <div>
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
    );
  }
}

export default withRouter(ReportingProtocolForm);
