import React, {Component} from "react";
import ErrorStore from "../stores/ErrorStore";
import sessionStore from "../stores/SessionStore";
import dispatcher from "../dispatcher";
import Redirect from "react-router-dom/es/Redirect";

class NetworkErrorRow extends Component {
  render() {
    return (
      <tr>
        <td>
            &ensp;&ensp;&ensp;&ensp;{this.props.log}
        </td>
      </tr>
    );
  }
}

class NetworkErrors extends Component {
  render() {
      const NetworkErrorRows = this.props.logSet.logs.map((log, i) =>
          <NetworkErrorRow key={i}
                           log={log}
                          />);
    return (
        <table>
          <tbody>
            <tr key={this.props.logSet.networkName}>
              <td>
                  Network: {this.props.logSet.networkName}
              </td>
            </tr>
            {NetworkErrorRows}
          </tbody>
        </table> );
  }
}

class NetworkErrorSets extends Component {
  render() {
      var NetworkErrorRows = [];
      console.log( this.props.logs );
      for ( var networkId in this.props.logs ) {
          NetworkErrorRows.push(
                      <NetworkErrors key={networkId}
                                     logSet={this.props.logs[ networkId ]}
                                      /> );
      }
    return (
        <div>
            <div><strong>Remote errors for operation:</strong></div>
            {NetworkErrorRows}
        </div> );
  }
}

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
    let message = "Unknown error";
    if ( (this.props.error) &&
         (this.props.error.status === 401) &&
         (!window.location.href.endsWith("/login")) ) {
      // Clear our session data which is clearly no longer valid.
      sessionStore.logout();
      return (
        <div>
          <Redirect to={{pathname: '/login', state: {from: this.props.location}}}/>
        </div>
      );
    }
    else if ( this.props.error.status ) {
        if ( this.props.error.statusText ) {
            message = "" + this.props.error.statusText +
                      " (code: " + this.props.error.status + ") ";
        }
        else if ( this.props.error.toString ) {
            message = this.props.error.toString();
        }

        if ( this.props.error.moreInfo ) {
          message += " " + this.props.error.moreInfo;
        }
    }
    else if ( ( this.props.error ) &&
              ( this.props.error.message ) ) {
        message = this.props.error.message;
    }
    else {
      if ( typeof this.props.error === "object" ) {
          return (
            <div className="alert alert-danger">
              <button type="button" className="close" onClick={this.handleDelete}><span>&times;</span></button>
              <NetworkErrorSets logs={this.props.error} />
            </div>
          );
      }
      else {
          message = JSON.stringify( this.props.error );
      }
    }
    return (
        <div className="alert alert-danger">
          <button type="button" className="close" onClick={this.handleDelete}><span>&times;</span></button>
          <strong>Error</strong> {message}
        </div>
      );
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
