import { isNil } from 'ramda';

export const inputEventToValue = e =>
  e.target.type === "number" || e.target.type === "select-one" ?
    parseInt(e.target.value, 10) :
  e.target.type === "checkbox" ?
    e.target.checked :
  e.target.value;


// Given a list of field specs, return an object that contains values for all
// of the fields.  If `fieldValue` in not present on a field spec, the proprety
// will be be created assigned an empty string (which works well for empty controlled input components)
export const fieldListToValues = fields =>
  fields.reduce((fieldVals, { fieldName, fieldValue })=> ({
      ...fieldVals,
      [fieldName]: isNil(fieldValue) ? '' : fieldValue,
    }), {});
