import React, {Component} from 'react';
import deviceStore from "../../../stores/DeviceStore";

// The default device network settings data entry, when the
// specific NetworkType's file is unavailable.
//
// Note that the naming of the component is always:
//    {NetworkType.name}DeviceNetworkSettings
class DefaultDeviceNetworkSettings extends Component {
    constructor( props ) {
        super( props );
        this.state = {
            enabled: false,
            wasEnabled: false,
            deviceProfileId: 0,
            deviceProfileIdOrig: 0,
            value: "{ }",
            original: "",
            rec: null,
            deviceProfileList: this.getMyDeviceProfiles(
                                props.referenceDataId, props.netRec.id ),
        };

        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
        this.onSubmit = this.onSubmit.bind( this );
        this.isChanged = this.isChanged.bind( this );
        this.isEnabled = this.isEnabled.bind( this );
        this.getMyLinkRecord = this.getMyLinkRecord.bind( this );
        this.getMyDeviceProfiles = this.getMyDeviceProfiles.bind( this );
    }

    getMyDeviceProfiles( appId, netId ) {
        deviceStore.getAllDeviceProfilesForAppAndNetType( appId, netId )
        .then( ( recs ) => {
            if ( 0 === recs.records.length ) {
                this.setState( { deviceProfileList: [ { id: 0, name: "(None Available)" } ] } );
            }
            else {
                this.setState( { deviceProfileList: recs.records } );
            }
        })
        .catch( ( err ) => {
            console.log( "Error getting device's possible deviceProfiles: " + err );

                this.setState( { deviceProfileList: [ { id: 0, name: "(None Available)" } ] } );
        });
    }

    componentDidMount() {
        this.getMyLinkRecord( this.props );
    }

    getMyLinkRecord( props ) {
        // Skip trying to load new records
        if ( !props.parentRec ||
             ( !props.parentRec.id ||
               0 === props.parentRec.id ) ) {
            this.setState( { enabled: false } );
            return;
        }

        deviceStore.getDeviceNetworkType( props.parentRec.id,
                                          props.netRec.id )
        .then( (rec) => {
            if ( rec ) {
                // Javascript libraries can get whiny with null.
                if ( !rec.networkSettings ) {
                    rec.networkSettings = undefined;
                }
                // We are saying we're enabled based on the database returned
                // data.  Let the parent know that they shoud rerender so show
                // that we are not enabled.  We do this from the setState
                // callback to ensure our state is, in fact, properly set.
                this.setState( { enabled: true,
                                 wasEnabled: true,
                                 value: rec.networkSettings,
                                 original: rec.networkSettings,
                                 deviceProfileId: rec.deviceProfileId,
                                 deviceProfileIdOrig: rec.deviceProfileId,
                                 rec: rec }, () => this.props.onChange() );
            }
            else {
                this.setState( { enabled: false, wasEnabled: false } );
            }
        })
        .catch( (err) => {
            console.log( "Failed to get deviceNetworkTypeLink:" + err );
            this.setState( { enabled: false, wasEnabled: false } );
        });
    }

    deselect() {
        let me = this;
        return new Promise( function( resolve, reject ) {
            me.setState( { enabled: false }, () => resolve() );
        });
    }

    select() {
        let me = this;
        return new Promise( function( resolve, reject ) {
            me.setState( { enabled: true }, () => resolve() );
        });
    }

    onTextChange( event ) {
        this.setState( { value: event.target.value })
    }

    onSelectionChange( event ) {
        this.setState({deviceProfileId: parseInt(event.target.value, 10)});
    }

    // Not an onSubmit for the framework, but called from the parent component
    // when the submit happens.  Do what needs to be done for this networkType.
    onSubmit = async function( e ) {
        var ret = this.props.netRec.name + " is unchanged.";
        // Did anything change?
        // Type is enabled...
        try {
            if ( this.state.enabled ) {
                // ... but we had no old record: CREATE
                if ( null == this.state.rec ) {
                    await deviceStore.createDeviceNetworkType(
                                    this.props.parentRec.id,
                                    this.props.netRec.id,
                                    this.state.deviceProfileId,
                                    this.state.value );
                    ret = this.props.netRec.name + " device created.";
                }
                // ...and we had an old record with a data change: UPDATE
                else if ( ( this.state.value !== this.state.original ) ||
                          ( this.state.deviceProfileId !== this.state.deviceProfileIdOrig ) ) {
                    var updRec = {
                        id: this.state.rec.id,
                        networkSettings: JSON.parse( this.state.value ),
                        deviceProfileId: this.state.deviceProfileId,
                    };
                    await deviceStore.updateDeviceNetworkType( updRec );
                    ret = this.props.netRec.name + " device updated.";
                }
            }
            // Type is NOT enabled AND we had a record: DELETE
            else if ( null != this.state.rec ) {
                await deviceStore.deleteDeviceNetworkType( this.state.rec.id );
                ret = this.props.netRec.name + " device deleted.";
            }
        }
        catch ( err ) {
            ret = this.props.netRec.name + " error: " + await err.text();
        }

        return ret;
    }

    isChanged() {
        if ( ( this.state.enabled !== this.state.wasEnabled ) ||
             ( this.state.value !== this.state.original ) ||
             ( this.state.deviceProfileId !== this.state.deviceProfileIdOrig ) ) {
                 return true;
        }
        else {
            return false;
        }
    }

    isEnabled() {
        return this.state.enabled;
    }

    render() {
        if ( null == this.state.deviceProfileList ) {
            return ( <div></div> );
        }
        return (
            <div className={this.state.enabled === true ? "" : "hidden" } >
                <div className="form-group">
                  <label className="control-label" htmlFor="deviceProfileId">Device Profile</label>
                  <select className="form-control"
                          id="deviceProfileIdDefault"
                          required
                          value={this.state.deviceProfileId}
                          onChange={this.onSelectionChange}>
                    {this.state.deviceProfileList.map( devpro => <option value={devpro.id} key={"defaultTypeSelector" + devpro.id }>{devpro.name}</option>)}
                  </select>
                  <p className="help-block">
                    Specifies the Device Profile that defines the communications settings this device will use.
                  </p>
                </div>
                <div className="form-group">
                    <label className="control-label"
                           htmlFor={this.props.netRec.name + "Data"}>
                        Raw JSON data to use as the networkSettings for {this.props.netRec.name} networks:
                    </label>
                    <textarea className="form-control"
                              name={this.props.netRec.name + "Data"}
                              value={this.state.value}
                              onChange={this.onTextChange} />
                </div>
            </div>
        );
    }
}

export default DefaultDeviceNetworkSettings;
