import React, { Component } from "react";
import { /*Route,*/ Link } from 'react-router-dom';
import PropTypes from 'prop-types';

//import SessionStore from "../../stores/SessionStore";
//import UserStore from "../../stores/UserStore";
import UserForm from "../../components/UserForm";

class CreateUser extends Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();

    this.state = {
      user: {},

    };

  }


  render() {


    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/Applications`}>Users</Link></li>
          <li className="active">Create</li>
        </ol>
        <div className="panel-body">
          <UserForm user={this.state.user}  update={true} />
        </div>


      </div>
    );
  }
}

export default CreateUser;
