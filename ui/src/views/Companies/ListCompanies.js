import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import Pagination from "../../components/Pagination";
import CompanyStore from "../../stores/CompanyStore";
import networkTypeStore from "../../stores/NetworkTypeStore";
import SessionStore from "../../stores/SessionStore";

class CompanyRow extends Component {
  render() {
    return (
      <tr>
        <td><Link to={`/admin/company/${this.props.company.id}`}>{this.props.company.name}</Link></td>
        <td>{this.props.company.type}</td>
      </tr>
    );
  }
}

class ListCompanies extends Component {
  constructor() {
    super();

    this.state = {
      pageSize: 20,
      networkTypesMap: {},
      companies: [],
      isAdmin: false,
      pageNumber: 1,
      pages: 1,
    };

    this.updatePage = this.updatePage.bind(this);

  }

  componentDidMount() {
    this.updatePage(this.props);

    SessionStore.on("change", () => {
      this.setState({
        isAdmin: SessionStore.isAdmin(),
      });
    });
  }

  componentWillReceiveProps(nextProps) {

    this.updatePage(nextProps);
  }

  updatePage(props) {
      this.setState({
          isAdmin: SessionStore.isAdmin(),
      });

      const page = props.page;

      let me = this;
      CompanyStore.getAll( this.state.pageSize,
                           (page - 1) * this.state.pageSize)
      .then( ( ret ) => {
          me.setState({
              companies: ret.records,
              pageNumber: page,
              pages: Math.ceil(ret.totalCount / this.state.pageSize),
          })
      })
      .catch( (err) => { console.log( "Error getting companies: ", err ) } );


      window.scrollTo(0, 0);

      networkTypeStore.getNetworkTypes()
      .then( networkTypes => {
          let networkTypesMap = {};
          if ( networkTypes ) {
              for (let i = 0; i < networkTypes.length; ++i) {
                  networkTypesMap[networkTypes[i].id] = networkTypes[i].name;
              }
          }
          this.setState({networkTypesMap: networkTypesMap});
      })
      .catch( err => console.log( "Failed to get networkTypes", err ) );
  }

  render() {
    const CompanyRows = this.state.companies.map((company) =>
        <CompanyRow key={company.id}
                    company={company}
                    networkTypesMap={this.state.networkTypesMap} />);

    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
            <li><Link to={`/admin/companies`}>Companies</Link></li>
        </ol>

        <div className="panel panel-default">

          <div className={`panel-heading clearfix `}>

            <div className={`btn-group pull-right`}>
              <Link to={`/admin/company`}>
                <button type="button" className="btn btn-default btn-sm">Create Company</button>
              </Link>
            </div>

          </div>

          <div className={`panel-body clearfix `}>
            <table className="table table-hover">
              <thead>
              <tr>
                <th className="col-md-3">Name</th>
                <th className="col-md-3">Type</th>
              </tr>
              </thead>
              <tbody>
              {CompanyRows}
              </tbody>
            </table>
          </div>

          <Pagination pages={this.state.pages} currentPage={this.state.pageNumber} pathname={`/companies`}/>

        </div>
      </div>
    );
  }
}

//
export default ListCompanies;
