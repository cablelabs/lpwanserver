//******************************************************************************
// Dislpay form with specified field inputs
//******************************************************************************

import React from 'react';
import PT from 'prop-types';
import FormInput from './FormInput';

//******************************************************************************
// Interface
//******************************************************************************

const fieldSpecShape = {
  name: PT.string.isRequired,  // input field Name
  type: PT.string.isRequired,  // HTML field input type 'string', 'number', 'checkbox', etc
  value: PT.node,              // initial/default value
  label: PT.string,            // Label for the input field
  description: PT.string,      // Shown below the input field for user info
  placehoder: PT.string,       // hint text displayed in empty field
  required: PT.bool,           // is a value required for this input field
  help: PT.string,             // provide more deatiled info about this field (pop up)
};

DynamicForm.propTypes = {
  fieldSpecs: PT.arrayOf(PT.shape(fieldSpecShape)).isRequired,
  fieldValues: PT.object.isRequired,
    // object containing props and corresponding values for the fieldNames
    // supplied in the list of field specs.
  onChange: PT.func,
    // called on change to any field. sig: onChange(path, fieldName, e)
  path: PT.arrayOf(PT.string),
    // path to supply to onChange()
    // this will tell parent component where in an object the fields are being set
};

DynamicForm.defaultValue = {
  onChange: ()=>null,
  path: [],
};

//******************************************************************************
// Component
//******************************************************************************

export default function DynamicForm(props) {
  const { fieldSpecs, fieldValues, path, onChange } = props;
  return (
    <div>
      { fieldSpecs.map((curFieldSpec,idx) =>
        <FormInput
          {...curFieldSpec}
          value={fieldValues[curFieldSpec.name]||''}
          onChange={e=>onChange(path, curFieldSpec.name, e)}
          key={idx}
        />
      )}
    </div>
  );
}
