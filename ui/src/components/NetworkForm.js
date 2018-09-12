import React from 'react';
import PT from 'prop-types';
import { propOr, isEmpty } from 'ramda';
import { noop, isArray } from 'ramda-adjunct';
import { arrayify } from '../utils/generalUtils';
import { getNetworkFields } from '../utils/protocolUtils';
import DynamicForm from './DynamicForm';
import FormInput from './FormInput';
import FormSelect from './FormSelect';

//******************************************************************************
// Interface
//******************************************************************************

const versionShape = {
  versionText: PT.string.isRequired, // For presentation to user
  versionValue: PT.string.isRequired, // Value to send to back end
};

NetworkForm.propTypes = {
  isNew: PT.bool,
  networkData: PT.object.isRequired,
  networkProtocol: PT.object.isRequired,
  networkProtocolVersion: PT.object,
  networkProtocolVersionList: PT.arrayOf(PT.shape(versionShape)),
  onDelete: PT.func,
  onSubmit: PT.func,
  submitText: PT.oneOfType([PT.string, PT.arrayOf(PT.string)]),
    // single message, or array of messages to be dispayed on seperate lines
  onChange: PT.func,
    // called on change to any field. sig: onChange(path, fieldName, e)
  path: PT.arrayOf(PT.string),
    // path to supply to onChange()
    // tells parent component where in an object the fields are being set
};

NetworkForm.defaultProps = {
  isNew: false,
  networkProtocolFields: [],
  path: [],
  onChange: noop,
  onSubmit: noop,
};

//******************************************************************************
// Form to edit new or existing network data
//******************************************************************************

export default function NetworkForm(props) {

  const { isNew, networkData={}, path, submitText, onChange, onSubmit, onDelete } = props;
  const { networkProtocol={}, networkProtocolVersion, networkProtocolVersionList=[] } = props;

  const securityData = propOr({}, 'securityData', networkData);
  const authorized = propOr(false, 'authorized', securityData);
  const serverAuthMessage = propOr('', 'message', securityData);

  const networkProtocolName = propOr('', 'name', networkProtocol);
  const networkProtocolFields = getNetworkFields(networkProtocol);
  const networkProtocolVersionText = propOr('', 'versionText', networkProtocolVersion);
  const networkProtocolVersionValue = propOr('', 'versionValue', networkProtocolVersion);

  const panelHeading = isNew ? `Create ${networkProtocolName} Network` : `Editing ${networkProtocolName} Network`;

  return(
    <div className='panel panel-default'>

      <div className='panel-heading d-flex jc-sb'>
        <h3 className='panel-title panel-title-buttons'>{panelHeading}</h3>
        { !isNew &&
        <div className='btn-group pull-right'>
          <button type='button' className='btn btn-danger btn-sm margin-top-xl'
            onClick={onDelete}> Delete Network
          </button>
        </div> }
      </div>

      <form onSubmit={onSubmit}>
        <div className='panel-body'>

          {!isNew && !authorized && !isEmpty(securityData) &&
            <div className='fs-sm bgc-danger txt-color-white pad-10 mrg-v-10 lh-compress'>
              <div className='fw-bold'>{`This network is not authorized with ${networkProtocolName}`}</div>
              <div>Your network security data will need to be updated</div>
              { serverAuthMessage && <div>{serverAuthMessage}</div>}
            </div>
          }

          { isArray(networkProtocolVersionList) && networkProtocolVersionList.length === 1 &&
            <div className='mrg-b-15 txt-color-alt'>
              {`${networkProtocolName} ${networkProtocolVersionText}`}
            </div>
          }

          { isNew && isArray(networkProtocolVersionList) && networkProtocolVersionList.length > 1 &&
            <FormSelect
              label={`${networkProtocolName} Version`}
              id='networkProtocolVersion'
              required
              selectProps={{ textProp: 'versionText', valueProp:'versionValue' }}
              selectList={networkProtocolVersionList}
              value={networkProtocolVersionValue}
              onChange={e=>onChange(path, 'networkProtocolVersion', e)}
              description={`Specifies which version of ${networkProtocolName} will be used`}
            />
          }

          <FormInput label='Network Name' name='name'  type='text' required
            placeholder={`e.g. 'Kyrio LoRa'`}
            value={networkData.name || ''}
            onChange={e=>onChange(path, 'name', e)}
            description='The name of the remote IoT network.'
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

          { networkProtocolFields &&
            <div className='form-section-margin-top'>
              <strong>{ `${networkProtocolName} ` } network security data</strong>
              <DynamicForm
                fieldSpecs={networkProtocolFields}
                fieldValues={securityData}
                onChange={onChange}
                path={[...path, 'securityData']}
                key={networkProtocolName}
              />
            </div>
          }

          <div className='flex-row jc-fe ac-fs ai-fs'>
            { submitText &&
              <div className = 'fs-xs mrg-r-10 txt-color-alt w-max-300 ta-rt lh-compress'>
                { arrayify(submitText).map((msg,i)=>
                <div className='mrg-b-5' key={i}>{ msg }</div>)}
              </div>
            }
            <div>
              <button type='submit' className='btn btn-primary'>Submit</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
