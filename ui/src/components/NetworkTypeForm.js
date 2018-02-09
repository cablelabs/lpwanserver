import React, {Component} from 'react';


import SessionStore from "../stores/SessionStore";
import NetworkStore from "../stores/NetworkStore";
import '../index.css';
import {withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';


class NetworkTypeForm extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
        networkType: props.networkType,
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
    let networkType = this.state.networkType;
    if (e.target.type === "number") {
      networkType[field] = parseInt(e.target.value, 10);
    } else if (e.target.type === "checkbox") {
      networkType[field] = e.target.checked;
    } else {
      networkType[field] = e.target.value;
    }
    this.setState({networkType: networkType});

  }

  onDelete(e) {
      e.preventDefault();
    //eslint-disable-next-line
    if (confirm("Are you sure you want to delete this network type?")) {
      NetworkStore.deleteNetworkType(this.state.networkType.id ).then( (responseData) => {
        this.props.history.push('/admin/networkTypes');
      })
      .catch( (err) => { alert( "Delete failed:" + err ); } );
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.onSubmit(this.state.networkType);
  }



  render() {
    if ( !this.state.networkType ||
         !this.state.networkType.id ) {
        return ( <div></div> );
    }

    return (

      <div>
        <div className="btn-group pull-right">
            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm" onClick={this.onDelete}>Delete Network Type
              </button>
            </div>
        </div>

        <hr/>
        <form onSubmit={this.handleSubmit}>
          <div>
            <div className="form-group">
              <label className="control-label" htmlFor="name">Network Type Name</label>
              <input className="form-control"
                     id="name"
                     type="text"
                     required
                     value={this.state.networkType.name || ''} onChange={this.onChange.bind(this, 'name')}/>
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

export default withRouter(NetworkTypeForm);
