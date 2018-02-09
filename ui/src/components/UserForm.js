import React, {Component} from 'react';
import PropTypes from 'prop-types';
import userStore from "../stores/UserStore";
import {withRouter} from "react-router-dom";

class UserForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();

    this.state = {
      user: {"isAdmin": false},
      showPasswordField: true,
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

  onChange(field, e) {
    let user = this.state.user;
    if (e.target.type === "checkbox") {
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

    userStore.createUser(this.state.user, (responseData) => {
      console.log(responseData);
      this.props.history.push('/users');
    });
  }

  render() {
    //let isAdmin = ((this.state.user.role === "Admin"));
    return (
      <form onSubmit={this.handleSubmit}>
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


        <div className="form-group">
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
