import React, {Component} from "react";
import {/*Route,*/ Link} from 'react-router-dom';
import PropTypes from 'prop-types';


import sessionStore from "../../stores/SessionStore";
import CompanyStore from "../../stores/CompanyStore";
import CompanyForm from "../../components/CompanyForm";


class CompanyLayout extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      company: {},
      isAdmin: sessionStore.isAdmin(),
    };
  }

  sessionChange() {
      this.setState({
        isAdmin: (sessionStore.isAdmin())
      });
  }

  componentDidMount() {
    sessionStore.on("change", this.sessionChange );

    CompanyStore.getCompany( this.props.match.params.companyID ).then((company) => {
        this.setState( { company: company } );
    })
    .catch( (err) => {
        console.log( "Error getting company " +
                     this.props.match.params.companyID +
                     ": " + err );
    });

  }

  componentWillDismount() {
      sessionStore.removeListener("change", this.sessionChange );
  }

  render() {

      if ( !this.state.company.id ) {
          return ( <div></div> );
      }

    let page = 1;
    if (this.props.history.location.state !== undefined)
      page = this.props.history.location.state.page;
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/companies`}>Companies</Link></li>
          <li className="active">{this.state.company.name}</li>
        </ol>
        <div className="panel-body">
          <CompanyForm company={this.state.company} onSubmit={this.onSubmit} update={true} page={page}/>
        </div>
      </div>
    );
  }
}

export default CompanyLayout;
