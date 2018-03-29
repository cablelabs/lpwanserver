import React, {Component} from 'react';
import Select from 'react-select';
import deviceStore from "../../../stores/DeviceStore";

// The LoRa deviceProfile network settings data entry
//
// Note that the naming of the component is always:
//    {NetworkType.name}DeviceProfileNetworkSettings
class LoRaDeviceProfileNetworkSettings extends Component {
    constructor( props ) {
        super( props );

        this.state = {
            activeTab: "general",
            enabled: false,
            wasEnabled: false,
            value: {},
            original: {},
            originalParentRec: JSON.stringify( props.parentRec ),
            rec: null,
        };

        this.changeTab = this.changeTab.bind(this);
        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
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
                // Convert the frequencies array to a string.  JSON backflip
                // makes a copy rather than a reference.
                let networkSettings = JSON.parse( JSON.stringify( props.parentRec.networkSettings ) );
                if ( networkSettings.factoryPresetFreqs ) {
                    let freqs = networkSettings.factoryPresetFreqs;
                    networkSettings.factoryPresetFreqsStr = freqs.map((c) => c.toString()).join( "," );
                    delete networkSettings[ "factoryPresetFreqs" ];
                }
                this.setState( { enabled: true,
                                 wasEnabled: true,
                                 value: networkSettings,
                                 original: JSON.stringify( networkSettings ),
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

    changeTab(e) {
      e.preventDefault();
      this.setState({
        activeTab: e.target.getAttribute("aria-controls"),
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

    onSelectChange(fieldLookup, val) {
       let lookup = fieldLookup.split(".");
       const fieldName = lookup[lookup.length-1];
       lookup.pop(); // remove last item

       let value = this.state.value;
       let obj = value;

       for (const f of lookup) {
         obj = obj[f];
       }

       obj[fieldName] = val.value;

       this.setState({
         value: value,
       });
   }

    onSelectionChange(field, e) {
      let value = this.state.value;
      value[ field ] = e.value;
      this.setState({value: value});
    }

    // Not an onSubmit for the framework, but called from the parent component
    // when the submit happens.  Do what need to be done for this networkType.
    onSubmit = async function() {
        var ret = this.props.parentRec.name + " is unchanged.";
        // The factoryPresetFreqsStr field should actually be an array.
        // We will convert it over prior to the store.
        if ( this.state.value &&
             this.state.value.factoryPresetFreqsStr ) {
            let freqStr = this.state.value.factoryPresetFreqsStr.split( "," );
            this.state.value.factoryPresetFreqs =
                        freqStr.map((c, i) => parseInt(c, 10));
            delete this.state.value[ "factoryPresetFreqsStr" ];
        }

        // Did anything change?
        // Type is enabled...
        try {
            if ( this.state.enabled ) {
                console.log( "State is enabled" );
                // ... but we had no old record: CREATE
                if ( !this.state.wasEnabled ) {
                    ret = await deviceStore.createDeviceProfile(
                                    this.props.parentRec.name,
                                    this.props.parentRec.description,
                                    this.props.parentRec.companyId,
                                    this.props.netRec.id,
                                    this.state.value );
                    console.log( "CREATE: ", ret );
                }
                // ...and we had an old record with a data change: UPDATE
                else if ( this.isChanged() ) {
                    var updRec = {
                        id: this.props.parentRec.id,
                        name: this.props.parentRec.name,
                        description: this.props.parentRec.description,
                        companyId: this.props.parentRec.companyId,
                        networkTypeId: this.props.netRec.id,
                        networkSettings: this.state.value
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
        // This is a little unusual - deviceProfiles don't follow the model of
        // a parent record and a network record - it's all one.  So we have to
        // check if the props changed as well.
        if ( ( this.state.enabled !== this.state.wasEnabled ) ||
             ( JSON.stringify( this.state.value ) !== this.state.original ) ||
             ( JSON.stringify( this.props.parentRec )!== this.state.originalParentRec ) ) {
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
         const macVersionOptions = [
           {value: "1.0.0", label: "1.0.0"},
           {value: "1.0.1", label: "1.0.1"},
           {value: "1.0.2", label: "1.0.2"},
           {value: "1.1.0", label: "1.1.0"},
         ];

         const regParamsOptions = [
           {value: "A", label: "A"},
           {value: "B", label: "B"},
         ];

        return (
            <div className={this.state.enabled === true ? "" : "hidden" } >
                <ul className="nav nav-tabs">
                    <li role="presentation" className={(this.state.activeTab === "general" ? "active" : "")}><a onClick={this.changeTab} href="#general" aria-controls="general">General</a></li>
                    <li role="presentation" className={(this.state.activeTab === "join" ? "active" : "")}><a onClick={this.changeTab} href="#join" aria-controls="join">Join (OTAA / ABP)</a></li>
                    <li role="presentation" className={(this.state.activeTab === "classC" ? "active" : "")}><a onClick={this.changeTab} href="#classC" aria-controls="classC">Class-C</a></li>
                </ul>
                <hr />
                <div className={(this.state.activeTab === "general" ? "" : "hidden")}>
                    <div className="form-group">
                        <label className="control-label" htmlFor="macVersion">LoRaWAN MAC version</label>
                        <Select
                            name="macVersion"
                            options={macVersionOptions}
                            value={this.state.value.macVersion}
                            onChange={this.onSelectChange.bind(this, 'macVersion')}
                        />
                        <p className="help-block">
                            Version of the LoRaWAN supported by the End-Device.
                        </p>
                    </div>
                    <div className="form-group">
                        <label className="control-label" htmlFor="macVersion">LoRaWAN Regional Parameters revision</label>
                        <Select
                            name="regParamsRevision"
                            options={regParamsOptions}
                            value={this.state.value.regParamsRevision}
                            onChange={this.onSelectChange.bind(this, 'regParamsRevision')}
                        />
                        <p className="help-block">
                            Revision of the Regional Parameters document supported by the End-Device.
                        </p>
                    </div>
                    <div className="form-group">
                        <label className="control-label" htmlFor="maxEIRP">Max EIRP</label>
                        <input className="form-control" name="maxEIRP" id="maxEIRP" type="number" value={this.state.value.maxEIRP || 0} onChange={this.onChange.bind(this, 'maxEIRP')} />
                        <p className="help-block">
                            Maximum EIRP supported by the End-Device.
                        </p>
                    </div>
                </div>
                <div className={(this.state.activeTab === "join" ? "" :   "hidden")}>
                    <div className="form-group">
                        <label className="control-label" htmlFor="supportsJoin">Supports join (OTAA)</label>
                        <div className="checkbox">
                            <label>
                                <input type="checkbox" name="supportsJoin" id="supportsJoin" checked={this.state.value.supportsJoin} onChange={this.onChange.bind(this, 'supportsJoin')} /> Supports join
                            </label>
                        </div>
                        <p className="help-block">
                            End-Device supports Join (OTAA) or not (ABP).
                        </p>
                    </div>
                    <div className={"form-group " + (this.state.value.supportsJoin === true ? "hidden" : "")}>
                        <label className="control-label" htmlFor="rxDelay1">RX1 delay</label>
                        <input className="form-control" name="rxDelay1" id="rxDelay1" type="number" value={this.state.value.rxDelay1 || 0} onChange={this.onChange.bind(this, 'rxDelay1')} />
                        <p className="help-block">
                            Class A RX1 delay (mandatory for ABP).
                        </p>
                    </div>
                    <div className={"form-group " + (this.state.value.supportsJoin === true ? "hidden" : "")}>
                        <label className="control-label" htmlFor="rxDROffset1">RX1 data-rate offset</label>
                        <input className="form-control" name="rxDROffset1" id="rxDROffset1" type="number" value={this.state.value.rxDROffset1 || 0} onChange={this.onChange.bind(this, 'rxDROffset1')} />
                        <p className="help-block">
                            RX1 data rate offset (mandatory for ABP).
                        </p>
                    </div>
                    <div className={"form-group " + (this.state.value.supportsJoin === true ? "hidden" : "")}>
                        <label className="control-label" htmlFor="rxDataRate2">RX2 data-rate</label>
                        <input className="form-control" name="rxDataRate2" id="rxDataRate2" type="number" value={this.state.value.rxDataRate2 || 0} onChange={this.onChange.bind(this, 'rxDataRate2')} />
                        <p className="help-block">
                            RX2 data rate (mandatory for ABP).
                        </p>
                    </div>
                    <div className={"form-group " + (this.state.value.supportsJoin === true ? "hidden" : "")}>
                        <label className="control-label" htmlFor="rxFreq2">RX2 channel frequency</label>
                        <input className="form-control" name="rxFreq2" id="rxFreq2" type="number" value={this.state.value.rxFreq2 || 0} onChange={this.onChange.bind(this, 'rxFreq2')} />
                        <p className="help-block">
                            RX2 channel frequency (mandatory for ABP).
                        </p>
                    </div>
                    <div className={"form-group " + (this.state.value.supportsJoin === true ? "hidden" : "")}>
                        <label className="control-label" htmlFor="factoryPresetFreqsStr">Factory-present frequencies</label>
                        <input className="form-control" id="factoryPresetFreqsStr" type="text" placeholder="e.g. 860100000, 868300000, 868500000" value={this.state.value.factoryPresetFreqsStr || ''} onChange={this.onChange.bind(this, 'factoryPresetFreqsStr')} />
                        <p className="help-block">
                            List of factory-preset frequencies (mandatory for ABP).
                        </p>
                    </div>
                </div>
                <div className={(this.state.activeTab === "classC" ? "" : "hidden")}>
                    <div className="form-group">
                        <label className="control-label" htmlFor="supportsClassC">Supports Class-C</label>
                        <div className="checkbox">
                            <label>
                                <input type="checkbox" name="supportsClassC" id="supportsClassC" checked={this.state.value.supportsClassC} onChange={this.onChange.bind(this, 'supportsClassC')} /> Supports Class-C
                            </label>
                        </div>
                        <p className="help-block">
                            End-Device supports Class C.
                        </p>
                    </div>
                    <div className={"form-group " + (this.state.value.supportsClassC === true ? "" : "hidden")}>
                        <label className="control-label" htmlFor="classCTimeout">Class-C confirmed downlink timeout</label>
                        <input className="form-control" name="classCTimeout" id="classCTimeout" type="number" value={this.state.value.classCTimeout || 0} onChange={this.onChange.bind(this, 'classCTimeout')} />
                        <p className="help-block">
                            Class-C timeout (in seconds) for confirmed downlink   transmissions.
                        </p>
                    </div>
                </div>
            </div>
        );
      }
}

export default LoRaDeviceProfileNetworkSettings;
