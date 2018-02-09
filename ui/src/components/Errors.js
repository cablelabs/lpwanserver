import React, {Component} from "react";
import ErrorStore from "../stores/ErrorStore";
import sessionStore from "../stores/SessionStore";
import dispatcher from "../dispatcher";
import Redirect from "react-router-dom/es/Redirect";

class ErrorLine extends Component {
  constructor() {
    super();
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleDelete() {
    dispatcher.dispatch({
      type: "DELETE_ERROR",
      id: this.props.id,
    });
  }

  render() {
    // Redirect to /login when not already there and entering bad user/pass.
    if ( (this.props.error.status === 401) &&
         (!window.location.href.endsWith("/login")) ) {
      // Clear our session data which is clearly no longer valid.
      sessionStore.logout();
      return (
        <div>
          <Redirect to={{pathname: '/login', state: {from: this.props.location}}}/>
        </div>
      );
    } else {
      var message;
      if ( this.props.error.statusText ) {
          message = "" + this.props.error.statusText +
                    " (code: " + this.props.error.status + ")";
      }
      else if ( this.props.error.toString ) {
          message = this.props.error.toString();
      }
      else {
          message = JSON.stringify( this.props.error );
      }
      return (
        <div className="alert alert-danger">
          <button type="button" className="close" onClick={this.handleDelete}><span>&times;</span></button>
          <strong>Error</strong> {message}
        </div>
      );
    }


  }
}

class Errors extends Component {
  constructor() {
    super();
    this.state = {
        errors: ErrorStore.getAll(),
    };
  }

  componentWillMount() {
    ErrorStore.on("change", () => {
      this.setState({
        errors: ErrorStore.getAll(),
      });
    });
  }

  render() {
    const ErrorLines = this.state.errors.map(
        (error, i) =>
            <ErrorLine key={error.id} id={error.id} error={error.error}/> );

    return (
      <div>
        {ErrorLines}
      </div>
    )
  }
}

export default Errors;
