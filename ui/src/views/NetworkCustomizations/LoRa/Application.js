import React, {Component} from 'react';
import Select from "react-select";
import {Controlled as CodeMirror} from "react-codemirror2";

import applicationStore from "../../../stores/ApplicationStore";


// The LoRa application network settings data entry
//
// Note that the naming of the component is always:
//    {NetworkType.name}ApplicationNetworkSettings
class LoRaApplicationNetworkSettings extends Component {
    constructor( props ) {
        super( props );

        this.defaultRec = {
            payloadCodec: "NONE",
            payloadEncoderScript: "",
            payloadDecoderScript: "",
        };

        this.state = {
            enabled: false,
            wasEnabled: false,
            value: this.defaultRec,
            original: JSON.stringify( this.defaultRec ),
            rec: null,
        };

        this.getMyLinkRecord( props );


        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.onSubmit = this.onSubmit.bind( this );
        this.isChanged = this.isChanged.bind( this );
        this.isEnabled = this.isEnabled.bind( this );
        this.getMyLinkRecord = this.getMyLinkRecord.bind( this );
    }

    getMyLinkRecord( props ) {
        // Check for display of new record (no id)
        if ( !props.parentRec ||
             ( !props.parentRec.id ||
               0 === props.parentRec.id ) ) {
            this.setState( { enabled: false } );
            return;
        }

        console.log(props);
        applicationStore.getApplicationNetworkType( props.parentRec.id,
                                                    props.netRec.id )
        .then( (rec) => {
            let recNetSet;
            if ( rec ) {
                // Javascript libraries can get whiny with null.
                if ( !rec.networkSettings ) {
                    recNetSet = this.defaultRec;
                }
                else {
                    // Sometimes the record in the database doesn't have the
                    // right data fields, especially if the data has changed.
                    // Make sure we have the fields at least defined.  We base
                    // what we should have on the defaultRec defined in the
                    // constructor.
                    // JSON stuff does a nice deep copy.
                    recNetSet = JSON.parse( JSON.stringify( rec.networkSettings ) );
                    for ( let key in this.defaultRec ) {
                        // Only add if not there - don't overwrite.
                        if ( !recNetSet[ key ] ) {
                            recNetSet[ key ] = this.defaultRec[ key ];
                        }
                    }
                }

                // We are saying we're enabled based on the database returned
                // data.  Let the parent know that they should rerender so show
                // that we are enabled.  We do this from the setState callback
                // to ensure our state is, in fact, properly set.
                this.setState( { enabled: true,
                                 wasEnabled: true,
                                 value: recNetSet,
                                 original: JSON.stringify( rec.networkSettings ),
                                 rec: rec }, () => this.props.onChange() );
            }
            else {
                this.setState( { enabled: false, wasEnabled: false } );
            }
        })
        .catch( (err) => {
            console.log( "Failed to get LoRa applicationNetworkTypeLink:" + err );
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

    onChange(field, e) {
      let value = this.state.value;

      if (e.target.type === "number") {
        value[field] = parseInt(e.target.value, 10);
      } else if (e.target.type === "checkbox") {
        value[field] = e.target.checked;
      } else {
        value[field] = e.target.value;
      }
      this.setState({value: value});
    }

    onSelectionChange(field, e) {
      let value = this.state.value;
      value[ field ] = e.value;
      // Add default code if needed.
      if ( e.value === "CUSTOM_JS" ) {
          if (value.payloadEncoderScript === "" ||
              value.payloadEncoderScript === undefined) {
            value.payloadEncoderScript = '// Encode encodes the given object into an array of bytes.\n';
            value.payloadEncoderScript += '//  - fPort contains the LoRaWAN fPort number\n';
            value.payloadEncoderScript += '//  - obj is an object, e.g. {"temperature": 22.5}\n';
            value.payloadEncoderScript += '// The function must return an array of bytes, e.g. [225, 230, 255, 0]\n';
            value.payloadEncoderScript += 'function Encode(fPort, obj) {\n';
            value.payloadEncoderScript += '    return [];\n';
            value.payloadEncoderScript += '}\n';
          }

          if (value.payloadDecoderScript === "" || value.payloadDecoderScript === undefined) {
            value.payloadDecoderScript = '// Decode decodes an array of bytes into an object.\n';
            value.payloadDecoderScript += '//  - fPort contains the LoRaWAN fPort number\n';
            value.payloadDecoderScript += '//  - bytes is an array of bytes, e.g. [225, 230, 255, 0]\n';
            value.payloadDecoderScript += '// The function must return an object, e.g. {"temperature": 22.5}\n';
            value.payloadDecoderScript += 'function Decode(fPort, bytes) {\n';
            value.payloadDecoderScript += '    return {};\n';
            value.payloadDecoderScript += '}\n';
          }
      }
      this.setState({value: value});
    }

    onCodeChange(field, editor, data, newCode) {
      let value = this.state.value;
       value[field] = newCode;
       this.setState({
         value: value,
       });
     }

    // Not an onSubmit for the framework, but called from the parent component
    // when the submit happens.  Do what need to be done for this networkType.
    onSubmit = async function( e ) {
console.log( "Submitting: state = ", this.state );
        var ret = this.props.parentRec.name + " is unchanged.";

        // If we aren't submitting custom code, get rid of the fields.
        if ( this.state.value.payloadCodec !== "CUSTOM_JS" ) {
            delete this.state.value[ "payloadDecoderScript" ];
            delete this.state.value[ "payloadEncoderScript" ];
        }

        // Did anything change?
        // Type is enabled...
        try {
            if ( this.state.enabled ) {
                // ... but we had no old record: CREATE
                if ( !this.state.wasEnabled ) {
                    await applicationStore.createApplicationNetworkType(
                                    this.props.parentRec.id,
                                    this.props.netRec.id,
                                    this.state.value );
                    ret = this.props.name + " is created.";
                }
                // ...and we had an old record with a data change: UPDATE
                else if ( JSON.stringify( this.state.value ) !== this.state.original ) {
                    console.log(this.props);
                    var updRec = {
                        id: this.props.netRec.id,
                        networkSettings: this.state.value
                    };
                    await applicationStore.updateApplicationNetworkType( updRec );
                    ret = this.props.name + " is updated.";
                }
            }
            // Type is NOT enabled AND we had a record: DELETE
            else if ( this.state.wasEnabled ) {
                await applicationStore.deleteApplicationNetworkType( this.state.rec.id );
                ret = this.props.name + " is deleted.";
            }
        }
        catch( err ) {
            console.log( "Error modifying remote LoRa network", err );
        }

        return ret;
    }

    isChanged() {
        if ( ( this.state.enabled !== this.state.wasEnabled ) ||
             ( JSON.stringify( this.state.value ) !== this.state.original ) ) {
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
        const payloadCodecOptions = [
           {value: "NONE", label: "None"},
           {value: "CAYENNE_LPP", label: "Cayenne LPP"},
           {value: "CUSTOM_JS", label: "Custom JavaScript codec functions"},
         ];

         const codeMirrorOptions = {
           lineNumbers: true,
           mode: "javascript",
           theme: 'base16-light',
         };

         if ( !this.state.value ||
              !this.state.value.payloadCodec ) {
             return ( <div></div> );
         }

        return (
            <div className={this.state.enabled === true ? "" : "hidden" } >
                <div className="form-group">
                    <label className="control-label"
                           htmlFor="payloadCodec">
                         Payload codec
                    </label>
                    <Select
                        name="payloadCodec"
                        options={payloadCodecOptions}
                        value={this.state.value.payloadCodec}
                        onChange={this.onSelectionChange.bind(this, 'payloadCodec')}
                    />
                    <p className="help-block">
                        By defining a payload codec, LoRa App Server can encode and decode the binary device payload for you.
                    </p>
                </div>
                <div className={"form-group " + (this.state.value.payloadCodec === "CUSTOM_JS" ? "" : "hidden")}>
                    <label className="control-label"
                           htmlFor="payloadDecoderScript">
                        Payload decoder function
                    </label>
                    <CodeMirror
                        value={this.state.value.payloadDecoderScript}
                        options={codeMirrorOptions}
                        onBeforeChange={this.onCodeChange.bind(this, 'payloadDecoderScript')}
                    />
                    <p className="help-block">
                        The function must have the signature <strong>function Decode(fPort, bytes)</strong> and must return an object.
                        LoRa App Server will convert this object to JSON.
                    </p>
                </div>
                <div className={"form-group " + (this.state.value.payloadCodec === "CUSTOM_JS" ? "" : "hidden")}>
                    <label className="control-label"
                           htmlFor="payloadEncoderScript">
                        Payload encoder function
                    </label>
                    <CodeMirror
                        value={this.state.value.payloadEncoderScript}
                        options={codeMirrorOptions}
                        onBeforeChange={this.onCodeChange.bind(this, 'payloadEncoderScript')}
                    />
                    <p className="help-block">
                        The function must have the signature <strong>function Encode(fPort, obj)</strong> and must return an array of bytes.
                    </p>

                </div>
            </div>
        );
      }
}

export default LoRaApplicationNetworkSettings;
