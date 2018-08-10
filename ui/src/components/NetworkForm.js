import React from 'react';
import PT from 'prop-types';
import { propOr, pathOr } from 'ramda';
import { noop } from 'ramda-adjunct';
import { idxById } from '../utils/objectListUtils';
import DynamicForm from './DynamicForm';
import FormInput from './FormInput';
import FormSelect from './FormSelect';

//******************************************************************************
// Interface
//******************************************************************************

NetworkForm.propTypes = {
  isNew: PT.bool,
  networkData: PT.object.isRequired,
  networkTypes: PT.arrayOf(PT.object),
  networkProtocols: PT.arrayOf(PT.object),
  networkProviders: PT.arrayOf(PT.object),
  onSubmit: PT.func,
  onDelete: PT.func,
  onChange: PT.func,
    // called on change to any field. sig: onChange(path, fieldName, e)
  path: PT.arrayOf(PT.string),
    // path to supply to onChange()
    // tells parent component where in an object the fields are being set

};

NetworkForm.defaultProps = {
  isNew: false,
  networkTypes: [],
  networkProtocols: [],
  networkProviders: [],
  path: [],
  onChange: noop,
  onSubmit: noop,
};

//******************************************************************************
// Form to edit new or existing network data
//******************************************************************************

export default function NetworkForm(props) {

  const { networkData={}, networkTypes=[], networkProtocols=[], networkProviders=[] } = props;
  const { isNew, path, onChange, onSubmit, onDelete } = props;
  const { securityData={} }  = networkData;

  const panelHeading = isNew ?
    'Create Network' :
    `Editing Network ${propOr('', 'name', networkData)}`;

  const currentProtocolFields =
    getCurrentProtocolFields(networkData.networkProtocolId, networkProtocols);
  const currentProtocolName =
    getCurrentProtocolName(networkData.networkProtocolId, networkProtocols);

  return(
    <div className="panel panel-default">
      <div className="panel-heading d-flex jc-sb">
        <h3 className="panel-title panel-title-buttons">{panelHeading}</h3>
        { !isNew &&
        <div className="btn-group pull-right">
            <div className="btn-group" role="group" aria-label="...">
              <button type="button" className="btn btn-danger btn-sm margin-top-xl"
                onClick={onDelete}> Delete Network
              </button>
            </div>
        </div> }
      </div>

      <form onSubmit={onSubmit}>
        <div className="panel-body">

          <FormInput label='Network Name' name='name'  type='text' required
            placeholder={`e.g. 'Kyrio LoRa'`}
            value={networkData.name || ''}
            onChange={e=>onChange(path, 'name', e)}
            description='The name of the remote IoT network.'
          />

          <FormSelect label='Network Type' id='networkTypeId' required
            selectProps={{ text:'name', value:'id' }}
            selectList={networkTypes || []}
            value={networkData.networkTypeId || 0}
            onChange={e=>onChange(path, 'networkTypeId', e)}
            description={'Specifies the Network Type that defines the data that '+
                         'the protocol handler code expects to receive.'}
          />

          <FormSelect label='Network Protocol' id='networkProtocolId'  required
            selectProps={{ text:'name', value:'id' }}
            selectList={networkProtocols || []}
            value={networkData.networkProtocolId || 0}
            onChange={e=>onChange(path, 'networkProtocolId', e)}
            description={'Specifies the Network Protocol that this application will use ' +
                         'to communicate with the remote network.  The selections here' +
                         'are limited by the choice of the network type above.'}
          />

          <FormSelect label='Network Provider' id='networkProviderId'  required
            selectProps={{ text:'name', value:'id' }}
            selectList={networkProviders || []}
            value={networkData.networkProviderId || 0}
            onChange={e=>onChange(path, 'networkProviderId', e)}
            description={'Specifies the Network Provider that is responsible for the ' +
                         'IoT network.  This is for informational purposes only.'}
          />

          <FormInput label='Network Base URL' name='baseUrl'  type='text' required
            placeholder={`e.g. 'https://myapp.com:12345/delivery/'`}
            value={networkData.baseUrl || ''}
            onChange={e=>onChange(path, 'baseUrl', e)}
            description={'The base API address that the network protocol uses to access ' +
                         'and update data on this network.  The network protocol may ' +
                         'append additional URL data to this path to access various ' +
                         'services as defined by the protocol. '}
          />

          { currentProtocolFields &&
            <div className="form-section-margin-top">
              <strong>{ `${currentProtocolName} ` } network specific data</strong>
              <DynamicForm
                fieldSpecs={currentProtocolFields}
                fieldValues={securityData}
                onChange={onChange}
                path={[...path, 'securityData']}
                key={currentProtocolName}
              />
            </div>
          }
          <div className="btn-toolbar pull-right">
            <button type="submit" className="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>
    </div>
  );
}


//******************************************************************************
// Helper Functions
//******************************************************************************

function getCurrentProtocolFields(networkProtocolId=0, networkProtocols=[] ) {
  const networkProtocolIndex = idxById(networkProtocolId, networkProtocols);
  return pathOr([],
    [networkProtocolIndex, 'metaData', 'protocolHandlerNetworkFields'], networkProtocols);
}

function getCurrentProtocolName(networkProtocolId=0, networkProtocols=[]) {
  const protocolIndex = idxById(networkProtocolId, networkProtocols);
  return pathOr('', [protocolIndex, 'name'], networkProtocols);
}
