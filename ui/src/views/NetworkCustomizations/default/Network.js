import React, {Component} from 'react';


// The default network settings data entry.  This differs from all of the other
// network settings in that the data is ALWAYS enabled because the network
// record is linked to the specific network.
//
// Note that the naming of the component is always:
//    {NetworkType.name}NetworkSettings
class DefaultNetworkSettings extends Component {
    constructor( props ) {
        super( props );

        let data = props.securityData;
        if ( "string" === typeof data ) {
            data = JSON.parse( data );
        }
        if ( !data.data ) {
            data.data = "";
        }
        this.state = {
            securityData: data
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
                  <label className="control-label" htmlFor="data">
                      Network Security Data
                  </label>
                  <input className="form-control"
                         id="data"
                         type="text"
                         required
                         value={this.state.securityData.data || ''}
                         onChange={this.onChange.bind(this, 'data')}/>
                  <p className="help-block">
                    The text data that gives access to the network.
                  </p>
                </div>
            </div>
        );
      }
}

export default DefaultNetworkSettings;
