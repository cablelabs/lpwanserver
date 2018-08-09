import React from 'react';
import PT from 'prop-types';

//******************************************************************************
// Interface
//******************************************************************************

FormInput.propTypes = {
  name: PT.string.isRequired,
  label: PT.string.isRequired,
  type: PT.string.isRequired,
  value: PT.oneOfType([PT.string,PT.number]),
  placeholder: PT.string,
  description: PT.string,
  help: PT.string,
  onChange: PT.func,
  required: PT.bool,
};

FormInput.defaultProps = {
  required: false,
  placeholder: '',
  onChange: ()=>null,
};

//******************************************************************************
// Interface
//******************************************************************************

export default function FormInput(props) {
  const { name, label, type, value, placeholder, description, onChange, required } = props;
  return (
    <div className="form-group">
      <label className="control-label" htmlFor={name}>{label}</label>
      <input className="form-control"
        {...{ type, name, value, placeholder, onChange, required }}
      />
      <p className="help-block">
        {description}
      </p>
    </div>
  );
}
