//******************************************************************************
// Dislpay form with specified field inputs
//******************************************************************************

import React from 'react';
import PT from 'prop-types';

//******************************************************************************
// Interface
//******************************************************************************

const fieldSpecShape = {
  fieldName: PT.string.isRequired,
  fieldType: PT.string.isRequired, // [string | number ] TODO: add zip/email, etc
  fieldDesc: PT.string.isRequired, // printed as the label above the field
  fieldHint: PT.string,            // hint text displayed in empty field
  fieldHelp: PT.string,
  displayWithQueryParameter: PT.string,
};

DynamicForm.propTypes = {
  fieldSpecs: PT.arrayOf(PT.shape(fieldSpecShape)).isRequired,
  fieldValues: PT.object.isRequired,
    // object containing props and corresponding values for the fieldNames
    // supplied in the list of field specs.
  path: PT.arrayOf(PT.string),
    // path to supply to onFieldChange()
    // this will tell parent component where in an object the fields are being set
  onFieldChange: PT.func,
    // called on change to any field. sig: onFieldChange(path, fieldName, e)
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
      { fieldSpecs.map((curField,idx) =>
        <FieldInput
          {...fieldSpecToInputProps(curField)}
          value={fieldValues[curField.fieldName]}
          onChange={e=>onFieldChange(path, curField.fieldName, e)}
          label={curField.fieldDesc || ''}
          placeholder='someplace'
          help='for help, see a doctor'
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

  const { label, type, value, placeholder, help, onChange, required } = props;
  return (
    <div className="form-group">
      <label className="control-label" htmlFor="name">{label}</label>
      <input className="form-control"
        {...{ type, value, placeholder, onChange, required }}
      />
      <p className="help-block">
        {help}
      </p>
    </div>
  );
}

//******************************************************************************
// Helper fxns
//******************************************************************************

function fieldSpecToInputProps(field) {
  return({
    type: field.fieldType,
    onChange: field.onChange,
  });
}
