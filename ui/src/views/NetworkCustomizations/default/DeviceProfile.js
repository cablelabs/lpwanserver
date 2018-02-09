import React, {Component} from 'react';
import deviceStore from "../../../stores/DeviceStore";

// The default deviceProfile network settings data entry, when the
// specific NetworkType's file is unavailable.
//
// Note that the naming of the component is always:
//    {NetworkType.name}DeviceProfileNetworkSettings
class DefaultDeviceProfileNetworkSettings extends Component {
    constructor( props ) {
        super( props );
        this.state = {
            enabled: false,
            wasEnabled: false,
            value: "{}",
            original: "{}",
            rec: null,
        };

        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
        this.onSubmit = this.onSubmit.bind( this );
        this.isChanged = this.isChanged.bind( this );
        this.isEnabled = this.isEnabled.bind( this );
        this.getMyLinkRecord = this.getMyLinkRecord.bind( this );
        this.componentDidMount = this.componentDidMount.bind( this );
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

    componentDidMount() {
        this.getMyLinkRecord( this.props );
    }

    getMyLinkRecord( props ) {
        // Did this record exist?  Or is it new?
        if ( props.parentRec && props.parentRec.id ) {
            // We get the deviceProfile record from the parent.  Make sure it's
            // our network.
            if ( props.parentRec.networkTypeId === props.netRec.id ) {
                this.setState( { enabled: true,
                                 wasEnabled: true,
                                 value: props.parentRec.networkSettings,
                                 original: props.parentRec.networkSettings,
                                 rec: props.parentRec }, () => this.props.onChange( props.netRec.name ) );
             }
             else {
                 // Not our network.
                 this.setState( { enabled: false } );
             }
        }
        // New record, so not selected.
        else {
            this.setState( { enabled: false } );
        }
    }

    onTextChange( event ) {
        this.setState( { value: event.target.value })
    }

    // Not an onSubmit for the framework, but called from the parent component
    // when the submit happens.  Do what need to be done for this networkType.
    onSubmit = async function( name ) {
        var ret = this.props.netRec.name + " is unchanged.";
        // Did anything change?
        // Type is enabled...
        try {
            if ( this.state.enabled ) {
                // ... but we had no old record: CREATE
                if ( !this.state.wasEnabled ) {
                    ret = await deviceStore.createDeviceProfile(
                                    this.props.parentRec.name,
                                    this.props.parentRec.companyId,
                                    this.props.netRec.id,
                                    this.state.value );
                    console.log( "CREATE: ", ret );
                }
                // ...and we had an old record with a data change: UPDATE
                else if ( this.state.value !== this.state.original ) {
                    var updRec = {
                        id: this.props.parentRec.id,
                        name: this.props.parentRec.name,
                        companyId: this.props.parentRec.companyId,
                        networkTypeId: this.props.netRec.id,
                        networkSettings: JSON.parse( this.state.value )
                    };
                    ret = await deviceStore.updateDeviceProfile( updRec );
                    console.log( "UPDATE: ", ret );
                }
            }
            // Type is NOT enabled AND we had a record: DELETE
            else if ( this.state.wasEnabled ) {
                ret = await deviceStore.deleteDeviceProfile( this.props.parentRec.id );
                console.log( "DELETE: ", ret );
            }
        }
        catch( err ) {
            console.log( "Failed to update deviceProfile:", err );
            ret = await err.text();
        }

        return ret;
    }

    isChanged() {
        if ( ( this.state.enabled !== this.state.wasEnabled ) ||
             ( this.state.value !== this.state.original ) ) {
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
        return (
            <div className={this.state.enabled === true ? "" : "hidden" } >
                <label className="control-label"
                       htmlFor={this.props.netRec.name + "Data"}>
                    Raw JSON data to use as the networkSettings for {this.props.netRec.name} networks:
                </label>
                <textarea className="form-control"
                          name={this.props.netRec.name + "Data"}
                          value={this.state.value}
                          onChange={this.onTextChange} />
            </div>
        );
      }
}

export default DefaultDeviceProfileNetworkSettings;
