import React, {Component} from 'react';


import sessionStore from "../stores/SessionStore";
import CompanyStore from "../stores/CompanyStore";
import NetworkSpecificUI from "../views/NetworkCustomizations/NetworkSpecificUI";
import '../index.css';
import {withRouter} from 'react-router-dom';
//import {Link, withRouter} from 'react-router-dom';
import Pagination from "../components/Pagination";
import PropTypes from 'prop-types';


class CompanyForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
        company: props.company,
        isGlobalAdmin: sessionStore.isAdmin(),
    };

    this.networkTypeLinksComp = {};

    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  sessionChange() {
      this.setState({
        isAdmin: (sessionStore.isAdmin())
      });
  }

  componentDidMount() {
    sessionStore.on("change", this.sessionChange );
  }

  componentWillUnmount(){
      sessionStore.removeListener("change", this.sessionChange );
  }

  handleSubmit = async function(e) {
    e.preventDefault();
    var me = this;
    try {
        await CompanyStore.updateCompany( this.state.company );
        if ( me.networkTypeLinksComp.onSubmit ) {
            var ret = await me.networkTypeLinksComp.onSubmit();
            console.log( "CompanyForm update returns", ret );
        }
        else {
            console.log("No data to update!" );
        }
    }
    catch( err ) {
        console.log( "Error updating company" , err );
    }

    me.props.history.push('/admin/companies');
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

  onDelete() {
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this company?")) {
      CompanyStore.deleteCompany(this.state.company.id )
      .then((responseData) => {
          this.props.history.push('/admin/companies');
      })
      .catch( ( err ) => {
          console.log( "Error deleting company", err );
      });
    }
  }


  render() {
      if ( !this.state.company ||
           !this.state.company.id ) {
          return ( <div></div> );
      }
      var me = this;
    return (

      <div>
        <div className="btn-group pull-right">
            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Company
              </button>
            </div>
        </div>

        <hr/>
        <form onSubmit={this.handleSubmit}>
          <div>
            <div className="form-group">
              <label className="control-label" htmlFor="name">Company Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     required
                     value={this.state.company.name || ''} onChange={this.onChange.bind(this, 'name')}/>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="type">Company Type</label>
              <select className="form-control" id="type" type="type" required
                     value={this.state.company.type || ''} onChange={this.onChange.bind(this, 'type')}>
                  <option value="admin">Site Admin</option>
                  <option value="vendor">Application Vendor</option>
              </select>
            </div>

            <NetworkSpecificUI
                  ref={ (comp) => { me.networkTypeLinksComp = comp; }}
                  dataName="Company"
                  dataRec={me.state.company} />

            <div className="btn-toolbar pull-right">
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>


          </div>

          <Pagination pages={this.state.pages}
                      currentPage={this.state.pageNumber}
                      pathname={`/admin/company/${this.state.company.id}`}/>

        </form>
      </div>
    );
  }
}

export default withRouter(CompanyForm);
