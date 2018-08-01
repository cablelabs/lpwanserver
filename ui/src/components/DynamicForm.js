//******************************************************************************
// Dislpay form with specified field inputs
//******************************************************************************

import React from 'react';
import PT from 'prop-types';

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
  onFieldChange: PT.func,
    // called on change to any field. sig: onFieldChange(path, fieldName, e)
  path: PT.arrayOf(PT.string),
    // path to supply to onFieldChange()
    // this will tell parent component where in an object the fields are being set
};

DynamicForm.defaultValue = {
  onFieldChange: ()=>null,
  path: [],
};

//******************************************************************************
// Component
//******************************************************************************

export default function DynamicForm(props) {
  const { fieldSpecs, fieldValues, path, onFieldChange } = props;
  return (
    <div>
      { fieldSpecs.map((curFieldSpec,idx) =>
        <FieldInput
          {...curFieldSpec}
          value={fieldValues[curFieldSpec.name]}
          onChange={e=>onFieldChange(path, curFieldSpec.name, e)}
          key={idx}
        />
      )}
    </div>
  );
}

//******************************************************************************
// Sub Components
//******************************************************************************

FieldInput.propTypes = {
  label: PT.string.isRequired,
  type: PT.string.isRequired,
  value: PT.oneOfType([PT.string,PT.number]),
  placeholder: PT.string,
  help: PT.string,
  onChange: PT.func,
  required: PT.bool,
};

FieldInput.defaultProps = {
  required: false,
  placeholder: '',
  onChange: ()=>null,
};

function FieldInput(props) {
  const { label, type, name, value, placeholder, description, onChange, required } = props;
  return (
    <div className="form-group">
      <label className="control-label" htmlFor="name">{label}</label>
      <input className="form-control"
        {...{ type, name, value, placeholder, onChange, required }}
      />
      <p className="help-block">
        {description}
      </p>
    </div>
  );
}
