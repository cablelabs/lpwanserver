import React, {Component} from 'react';
import PropTypes from 'prop-types';
import sessionStore from "../stores/SessionStore";
import userStore from "../stores/UserStore";
import {withRouter} from "react-router-dom";
import companyStore from "../stores/CompanyStore";
import Select from 'react-select';

class UserForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    let isGlobalAdmin = sessionStore.isGlobalAdmin();
    let isAdmin = sessionStore.isAdmin();
    this.state = {
        user: {"isAdmin": false},
        showPasswordField: true,
        isGlobalAdmin: isGlobalAdmin,
        isAdmin: isAdmin,
        filterList: undefined
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    this.setState({
      showPasswordField: (typeof(this.props.user.id) === "undefined"),
      user: this.props.user,
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      showPasswordField: (typeof(nextProps.user.id) === "undefined"),
      user: nextProps.user,
    });
  }

  sessionWatch() {
    this.setState({
      isGlobalAdmin: sessionStore.isGlobalAdmin(),
    });
  }

  componentDidMount = async function (props) {
    // Check for a user, and redirect to login if none is set.
    let user = sessionStore.getUser();
    if (!user || !user.id || (user.id === 0)) {
      this.props.history.push("/login");
      return;
    }

    sessionStore.on("change", this.sessionWatch);

    // Admin?  Needs company list.
    let companies = {};
    let filterList = [];
    if (this.state.isAdmin) {
      let recs;
      try {
        let cos = await companyStore.getAll();
        recs = cos.records;
      }
      catch (err) {
        console.log("Error getting company selection list:" + err);
        recs = [];
      }
      for (let i = 0; i < recs.length; ++i) {
        let rec = recs[i];
        companies[rec.id] = rec;
        filterList.push({label: rec.name, value: rec.id});
      }
    }
    this.setState({
      companies: companies,
      filterList: filterList
    });

  };


  onChange(field, e) {
    let user = this.state.user;
    if (field === 'companyId') {
      user[field] = e.value;
    }
    else if (e.target.type === "checkbox") {
      user[field] = e.target.checked;
    } else {
      user[field] = e.target.value;
    }
    this.setState({
      user: user,
    });
  }

  handleSubmit(e) {
      e.preventDefault();

      userStore.createUser( this.state.user ).then( (responseData) => {
          this.props.history.push('/users');
      })
      .catch( ( err ) => {
          console.log( "Error creating user: ", err );
      });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
          <div className={`panel-body clearfix ${this.state.isGlobalAdmin ? '' : 'hidden'}`}>
              <div className="form-group">
                  <label className="control-label" htmlFor="companyId">Company</label>
                  <Select
                    value={this.state.user.companyId}
                    options={this.state.filterList}
                    onChange={this.onChange.bind(this, 'companyId')}
                    placeholder="Select Company"/>
              </div>
          </div>
        <div className="form-group">
          <label className="control-label" htmlFor="username">Username</label>
          <input className="form-control" id="username" type="text" placeholder="username" required
                 value={this.state.user.username || ''} onChange={this.onChange.bind(this, 'username')}/>
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="email">Email</label>
          <input className="form-control" id="email" type="text" placeholder="Email" required
                 value={this.state.user.email || ''} onChange={this.onChange.bind(this, 'email')}/>
        </div>


        <div className={"form-group " + (this.state.showPasswordField ? '' : 'hidden')}>
          <label className="control-label" htmlFor="password">Password</label>
          <input className="form-control" id="password" type="password" placeholder="password"
                 value={this.state.user.password || ''} onChange={this.onChange.bind(this, 'password')}/>
        </div>

        <div className={"form-group" + (sessionStore.getUser().isAdmin ? "" : " hidden" ) }>
          <label className="checkbox-inline">
            <input type="checkbox" name="isAdmin" id="isAdmin" checked={this.state.user.isAdmin}
                   onChange={this.onChange.bind(this, 'isAdmin')}/> Is admin &nbsp;
          </label>
        </div>
        <hr/>
        <div className="btn-toolbar pull-right">
          <a className="btn btn-default" onClick={this.context.router.goBack}>Go back</a>
          <button type="submit" className="btn btn-primary">Submit</button>
        </div>
      </form>
    );
  }
}

export default withRouter(UserForm);
