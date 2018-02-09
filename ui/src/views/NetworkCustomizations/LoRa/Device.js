import React, {Component} from 'react';
import deviceStore from "../../../stores/DeviceStore";

// The LoRa device network settings data entry.
//
// Note that the naming of the component is always:
//    {NetworkType.name}DeviceNetworkSettings
class LoRaDeviceNetworkSettings extends Component {
    constructor( props ) {
        super( props );
        let initValue = {
            devEUI: "",
            appKey: "",
        };
        this.state = {
            enabled: false,
            wasEnabled: false,
            deviceProfileId: 0,
            deviceProfileIdOrig: 0,
            value: initValue,
            original: JSON.stringify( initValue ),
            rec: null,
            deviceProfileList: this.getMyDeviceProfiles(
                                props.referenceDataId, props.netRec.id ),
        };

        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
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
                this.setState( { deviceProfileList: recs.records,
                                 deviceProfileId: recs.records[ 0 ].id } );
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
                                 original: JSON.stringify( rec.networkSettings ),
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

    onTextChange( field, event ) {
        let v = this.state.value;
        v[ field ] = event.target.value;
        this.setState( { value: v } );
    }

    onSelectionChange(field, e) {
        this.setState({deviceProfileId: parseInt(e.target.value, 10)});
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
                    console.log( this.props.parentRec.id );
                    console.log( this.props.netRec.id );
                    console.log( this.state.deviceProfileId );
                    console.log( this.state.value );
                    await deviceStore.createDeviceNetworkType(
                                    this.props.parentRec.id,
                                    this.props.netRec.id,
                                    this.state.deviceProfileId,
                                    this.state.value );
                    ret = this.props.netRec.name + " device created.";
                }
                // ...and we had an old record with a data change: UPDATE
                else if ( ( JSON.stringify( this.state.value ) !== this.state.original ) ||
                          ( this.state.deviceProfileId !== this.state.deviceProfileIdOrig ) ) {
                    var updRec = {
                        id: this.state.rec.id,
                        networkSettings: this.state.value,
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
            ret = this.props.netRec.name + " error: " + err;
        }

        return ret;
    }

    isChanged() {
        if ( ( this.state.enabled !== this.state.wasEnabled ) ||
             ( JSON.stringify( this.state.value ) !== this.state.original ) ||
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
                          id="deviceProfileId"
                          required
                          value={this.state.deviceProfileId}
                          onChange={this.onSelectionChange.bind(this, 'deviceProfileId')}>
                    {this.state.deviceProfileList.map( devpro => <option value={devpro.id} key={"typeSelector" + devpro.id }>{devpro.name}</option>)}
                  </select>
                  <p className="help-block">
                    Specifies the Device Profile that defines the communications settings this device will use.
                  </p>
                </div>
                <div className="form-group">
                    <label className="control-label"
                           htmlFor="devEUI">
                        The Device EUI identifying the device on a LoRa network
                    </label>
                    <input type="text"
                           className="form-control"
                           name="devEUI"
                           value={this.state.value.devEUI}
                           pattern="[0-9a-fA-F]{16}"
                           onChange={this.onTextChange.bind( this, 'devEUI' )} />
                    <p className="help-block">
                        A 16-hex-digit string used to identify the device
                        on LoRa networks.
                    </p>
                </div>
                <div className="form-group">
                    <label className="control-label"
                           htmlFor="appKey">
                        The Application Encryption Key for this device.
                    </label>
                    <input type="text"
                           className="form-control"
                           name="appKey"
                           value={this.state.value.appKey}
                           pattern="[0-9a-fA-F]{32}"
                           onChange={this.onTextChange.bind( this, 'appKey')} />
                    <p className="help-block">
                        A 32-hex-digit string used to identify the device
                        on LoRa networks.
                    </p>
                </div>
            </div>
        );
      }
}

export default LoRaDeviceNetworkSettings;
