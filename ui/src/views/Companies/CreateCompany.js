import React, {Component} from "react";
import {Link, withRouter} from 'react-router-dom';

import CompanyStore from "../../stores/CompanyStore";
import ErrorStore from "../../stores/ErrorStore";
import NetworkSpecificUI from "../NetworkCustomizations/NetworkSpecificUI";
import PropTypes from 'prop-types';


class CreateCompany extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      company: {type: "vendor"},
    };

    this.networkTypeLinksComp = {};

    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit = async function(e) {
    e.preventDefault();
    let me = this;

    try {
        let id = await CompanyStore.createCompany( this.state.company );
        // Need to update the ID so the co links can get created
        let co = this.state.company;
        co.id = id.id;
        this.setState( { company: co }, async function() {
            if ( me.networkTypeLinksComp.onSubmit ) {
                await me.networkTypeLinksComp.onSubmit();
            }
            else {
                console.log("No data to update!" );
            }
            this.props.history.push('/admin/companies');
        });
    }
    catch( err ) {
        ErrorStore.createError( err );
    }
  }

  componentWillMount() {

  }

  onChange(field, e) {
    let company = this.state.company;

    if (e.target.type === "number") {
      company[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      company[field] = e.target.checked;
    } else {
      company[field] = e.target.value;
    }
    this.setState({company: company});
  }

  render() {
    let me = this;

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li className="active">Create Company</li>
        </ol>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title panel-title-buttons">Create Company</h3>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className="panel-body">
              <div className="form-group">
                <label className="control-label" htmlFor="name">company name</label>
                <input className="form-control" id="name" type="text" placeholder="e.g. 'Cablelabs'" required value={this.state.company.name || ''}
                       onChange={this.onChange.bind(this, 'name')}/>

              </div>

              <div className="form-group">
                <label className="control-label">Admin User Name</label>
                <input className="form-control" id="username" type="text" placeholder="admin"
                       pattern="[\w-]+" required value={this.state.company.username || ''}
                       onChange={this.onChange.bind(this, 'username')}/>
              </div>

              <div className="form-group">
                <label className="control-label" htmlFor="password">Password</label>
                <input className="form-control" id="password" type="password" placeholder="password"
                       value={this.state.company.password || ''} onChange={this.onChange.bind(this, 'password')}/>
              </div>

              <div className="form-group">
                <label className="control-label" htmlFor="email">Email</label>
                <input className="form-control" id="email" type={"text"} placeholder="e.g., joe@kyrio.com"
                       value={this.state.company.email || ''} onChange={this.onChange.bind(this, 'email')}/>
              </div>

              <NetworkSpecificUI
                    ref={ (comp) => { me.networkTypeLinksComp = comp; }}
                    dataName="Company"
                    parentDataId={0}
                    dataRec={me.state.company} />

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

export default withRouter(CreateCompany);
