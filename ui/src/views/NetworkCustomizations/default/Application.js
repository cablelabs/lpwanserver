import React, {Component} from 'react';
import applicationStore from "../../../stores/ApplicationStore";

// The default company network settings data entry, when the
// specific NetworkType's file is unavailable.
//
// Note that the naming of the component is always:
//    {NetworkType.name}ApplicationNetworkSettings
class DefaultApplicationNetworkSettings extends Component {
    constructor( props ) {
        super( props );
        this.state = {
            enabled: false,
            wasEnabled: false,
            value: "{ }",
            original: "",
            rec: null,
        };

        this.getMyLinkRecord( props );

        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
        this.onSubmit = this.onSubmit.bind( this );
        this.isChanged = this.isChanged.bind( this );
        this.isEnabled = this.isEnabled.bind( this );
        this.getMyLinkRecord = this.getMyLinkRecord.bind( this );
    }

    getMyLinkRecord( props ) {
        // Skip trying to load new records
        if ( !props.parentRec ||
             ( !props.parentRec.id ||
               0 === props.parentRec.id ) ) {
            this.setState( { enabled: false } );
            return;
        }

        applicationStore.getApplicationNetworkType( props.parentRec.id,
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
                                 rec: rec }, () => this.props.onChange() );
            }
            else {
                this.setState( { enabled: false, wasEnabled: false } );
            }
        })
        .catch( (err) => {
            console.log( "Failed to get applicationNetworkTypeLink:" + err );
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

    // Not an onSubmit for the framework, but called from the parent component
    // when the submit happens.  Do what need to be done for this networkType.
    onSubmit = async function( e ) {
        var ret = this.props.netRec.name + " is unchanged.";
        // Did anything change?
        // Type is enabled...
        try {
            if ( this.state.enabled ) {
                // ... but we had no old record: CREATE
                if ( null == this.state.rec ) {
                    ret = await applicationStore.createApplicationNetworkType(
                                    this.props.parentRec.id,
                                    this.props.netRec.id,
                                    this.state.value );
                }
                // ...and we had an old record with a data change: UPDATE
                else if ( this.state.value !== this.state.original ) {
                    var updRec = {
                        id: this.state.rec.id,
                        networkSettings: JSON.parse( this.state.value )
                    };
                    ret = await applicationStore.updateApplicationNetworkType( updRec );
                }
            }
            // Type is NOT enabled AND we had a record: DELETE
            else if ( null != this.state.rec ) {
                ret = await applicationStore.deleteApplicationNetworkType( this.state.rec.id );
            }
        }
        catch ( err ) {
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

export default DefaultApplicationNetworkSettings;
