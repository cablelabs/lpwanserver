import React, {Component} from 'react';


import SessionStore from "../stores/SessionStore";
import networkProviderStore from "../stores/NetworkProviderStore";
import '../index.css';
import {withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';


class NetworkProviderForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
        networkProvider: props.networkProvider,
        isGlobalAdmin: SessionStore.isAdmin(),
    };

    this.componentWillMount = this.componentWillMount.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  componentWillMount() {
    SessionStore.on("change", () => {
      this.setState({
        isGlobalAdmin: SessionStore.isAdmin(),
      });
    });
  }

    onChange(field, e) {
    let networkProvider = this.state.networkProvider;
    if (e.target.type === "number") {
      networkProvider[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      networkProvider[field] = e.target.checked;
    } else {
      networkProvider[field] = e.target.value;
    }
    this.setState({networkProvider: networkProvider});

  }

  onDelete(e) {
      e.preventDefault();
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this network type?")) {
      networkProviderStore.deleteNetworkProvider(this.state.networkProvider.id ).then( (responseData) => {
        this.props.history.push('/admin/networkProviders');
      })
      .catch( (err) => { alert( "Delete failed:" + err ); } );
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state.networkProvider);
  }



  render() {
    if ( !this.state.networkProvider ||
         !this.state.networkProvider.id ) {
        return ( <div></div> );
    }

    return (

      <div>
        <div className="btn-group pull-right">
            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Network Provider
              </button>
            </div>
        </div>

        <hr/>
        <form onSubmit={this.handleSubmit}>
          <div>
            <div className="form-group">
              <label className="control-label" htmlFor="name">Network Provider Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     required
                     value={this.state.networkProvider.name || ''} onChange={this.onChange.bind(this, 'name')}/>
            </div>
            <div className="btn-toolbar pull-right">
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>

          </div>

        </form>
      </div>
    );
  }
}

export default withRouter(NetworkProviderForm);
