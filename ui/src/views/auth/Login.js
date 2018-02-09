import React, { Component } from 'react';
import sessionStore from "../../stores/SessionStore";
import ErrorStore from "../../stores/ErrorStore";
//import {withRouter} from "react-router-dom";
import PropTypes from 'prop-types';

class Login extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();

    this.state = {
      login: {},
    };


    this.onSubmit = this.onSubmit.bind(this);
  }

  componentWillMount() {
    sessionStore.logout(() => {});
  }

  onChange(field, e) {
    let login = this.state.login;
    login[field] = e.target.value;
    this.setState({
      login: login,
    });
  }

  onSubmit(e) {
    e.preventDefault();
    ErrorStore.clear();
    sessionStore.login(this.state.login, (token) => {
      this.props.history.push("/");
    });
  }

  render() {
    return(
      <div>
        <ol className="breadcrumb">
          <li className="active">Login</li>
        </ol>
        <hr />
        <div className="panel panel-default">
          <div className="panel-body">
            <form onSubmit={this.onSubmit}>
              <div className="form-group">
                <label className="control-label" htmlFor="login_username">Username</label>
                <input className="form-control" id="login_username" type="text" placeholder="username" required value={this.state.login.login_username || ''} onChange={this.onChange.bind(this, 'login_username')} />
              </div>
              <div className="form-group">
                <label className="control-label" htmlFor="login_password">Password</label>
                <input className="form-control" id="login_password" type="password" placeholder="password" value={this.state.login.login_password || ''} onChange={this.onChange.bind(this, 'login_password')} />
              </div>
              <hr />
              <button type="submit" className="btn btn-primary pull-right">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
