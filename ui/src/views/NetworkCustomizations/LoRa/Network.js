import React, {Component} from 'react';


// The LoRa network settings data entry.  This differs from all of the other
// network settings in that the data is ALWAYS enabled because the network
// record is linked to the specific network.
//
// Note that the naming of the component is always:
//    {NetworkType.name}NetworkSettings
class LoRaNetworkSettings extends Component {
    constructor( props ) {
        super( props );
        this.state = {
            securityData: props.securityData
        };

        this.onChange = this.onChange.bind(this);
        this.isChanged = this.isChanged.bind( this );
    }

    onChange(field, e) {
        let securityData = this.state.securityData;
        if ( (e.target.type === "number") || (e.target.type === "select-one") ) {
          securityData[field] = parseInt(e.target.value, 10);
        } else if (e.target.type === "checkbox") {
          securityData[field] = e.target.checked;
        } else {
            if (securityData === "{}") {
                securityData = {};
            }
            securityData[field] = e.target.value;
        }
        this.setState( { securityData: securityData } );
    }

    // Not an onSubmit for the framework, but called from the parent component
    // when the submit happens.  Do what need to be done for this networkType.
    getSecurityData() {
        return this.state.securityData;
    }

    isChanged() {
        // Do the stringify of the parse in case there are odd strings in the
        // original data.
        return ( JSON.stringify( this.state.securityData ) !==
                    JSON.stringify( JSON.parse( this.props.securityData ) ) );
    }

    render() {
        return (
            <div>
                <div className="form-group">
                  <label className="control-label" htmlFor="username">
                      Network Admin Login
                  </label>
                  <input className="form-control"
                         id="username"
                         type="text"
                         placeholder="e.g. 'admin'"
                         required
                         value={this.state.securityData.username || ''}
                         onChange={this.onChange.bind(this, 'username')}/>
                  <p className="help-block">
                    The username of the remote IoT network.
                  </p>
                </div>
                <div className="form-group">
                  <label className="control-label" htmlFor="password">
                      Password
                  </label>
                  <input className="form-control"
                         id="password"
                         type="password"
                         required
                         value={this.state.securityData.password || ''}
                         onChange={this.onChange.bind(this, 'password')}/>
                </div>
            </div>
        );
      }
}

export default LoRaNetworkSettings;
