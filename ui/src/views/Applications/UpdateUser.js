import React, {Component} from 'react';
import {Link, withRouter} from 'react-router-dom';

import UserStore from "../../stores/UserStore";
import PropTypes from 'prop-types';


class UpdateUser extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();

    this.state = {
      user: {isAdmin : false},
      showPasswordField: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onPress = this.onPress.bind(this);
    this.onChange = this.onChange.bind(this);
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

  componentWillMount() {
    UserStore.getUser(this.props.match.params.userID, (user) => {
      user.isAdmin = ((user.role === "admin"));
      console.log(user);
      this.setState({
        user: user,
      });
    });
  }

  onSubmit() {
    console.log("submit");
    UserStore.updateUser(this.props.match.params.userID, this.state.user, (responseData) => {
      console.log(responseData);
      //this.props.history.push('/users');
    });
  }

  onDelete() {

    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this user?")) {
      UserStore.deleteUser(this.props.match.params.userID, (responseData) => {
        //console.log(responseData);
        this.props.history.push('/users');
      });
    }
  }

  onPress() {
    console.log("press");
    this.setState({
      showPasswordField: true,
    });

  }

//<Button title="Change Text" onPress={this.onPress}/>
  render() {
    //console.log(this.state.user);
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/users">Users</Link></li>
          <li className="active">{this.state.user.username}</li>
        </ol>
        <div className="clearfix">


          <div className="btn-group pull-right" role="group" aria-label="...">
              <button type="button" className="btn btn-default" onClick={this.onPress}>Change password</button>
            &nbsp;
          </div>

          <div className="btn-group pull-right" role="group" aria-label="...">
            <button type="button" className="btn btn-danger" onClick={this.onDelete}>Delete user</button>
          </div>


        </div>
        <hr/>
        <div className="panel panel-default">
          <div className="panel-body">


            <form onSubmit={this.onSubmit}>
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
                <button type="submit" className="btn btn-primary" >Submit</button>
              </div>
            </form>


          </div>
        </div>
      </div>
    );
  }
}

/*
              <div className={"form-group " + (this.state.showPasswordField ? '' : 'hidden')}>
                <label className="control-label" htmlFor="password">Password</label>
                <input className="form-control" id="password" type="password" placeholder="password"
                       value={this.state.user.passwordMatch || ''} onChange={this.onChange.bind(this, 'passwordMatch')}/>
              </div>

 */

export default withRouter(UpdateUser);
