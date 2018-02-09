import React, {Component} from "react";
import {Link, withRouter} from 'react-router-dom';

import networkTypeStore from "../../stores/NetworkTypeStore";
import PropTypes from 'prop-types';


class CreateNetworkType extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      name: "",
    };

    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(e) {
    e.preventDefault();
    networkTypeStore.createNetworkType(this.state.name).then( (responseData) => {
      this.props.history.push('/admin/networkTypes');
    });
  }

  componentWillMount() {

  }

  onChange(field, e) {
    this.setState({name: e.target.value});
  }

  render() {
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to={`/`}>Home</Link></li>
          <li><Link to={`/admin/networkTypes`}>Network Types</Link></li>
          <li className="active">Create Network Type</li>
        </ol>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title panel-title-buttons">Create Network Type</h3>
          </div>
          <form onSubmit={this.onSubmit}>
            <div className="panel-body">
              <div className="form-group">
                <label className="control-label" htmlFor="name">Network Type Name</label>
                <input className="form-control" id="name" type="text" placeholder="e.g. 'LoRa'"
                       pattern="[\w-]+" required value={this.state.name || ''}
                       onChange={this.onChange.bind(this, 'name')}/>
                <p className="help-block">
                  The name may only contain words, numbers and dashes.
                </p>
              </div>

              <div className="btn-toolbar pull-right">
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </div>
          </form>

        </div>
      </div>
    );
  }
}

export default withRouter(CreateNetworkType);
