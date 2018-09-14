import React from 'react';
import PT from 'prop-types';

//******************************************************************************
// Interface
//******************************************************************************

const selectPropsShape = {
  textProp: PT.string.isRequred,  // prop on objects in select list to use for select list text
  valueProp: PT.string.isRequred, // prop on objects in select list to use for select list value
};

FormSelect.propTypes = {
  id: PT.string.isRequired,
  label: PT.string.isRequired,
  description: PT.string,
  help: PT.string,
  value: PT.oneOfType([PT.string,PT.number]),
  selectList: PT.arrayOf(PT.object).isRequired,
  selectProps: PT.shape(selectPropsShape).isRequired,
  onChange: PT.func,
  required: PT.bool,
};

FormSelect.defaultProps = {
  required: false,
  onChange: ()=>null,
};

//******************************************************************************
// Interface
//******************************************************************************


export default function FormSelect(props) {

  const { id, label, description, required, } = props;
  const { value, selectList=[], selectProps={}, onChange, } = props;
  const { textProp, valueProp } = selectProps;

  return (
    <div className="form-group">
      <label className="control-label" htmlFor={id}>{label}</label>
      <select className="form-control" {...{ id, required, value, onChange }}>
        { selectList.map( (listEntry, i) =>
          <option key={i} value={listEntry[valueProp]}>
            {listEntry[textProp]}
          </option>
        )}
      </select>
      <p className="help-block">
        {description}
      </p>
    </div>
  );
}
