import { length } from 'ramda';
import { isArray } from 'ramda-adjunct';


export const arrayify = input => isArray(input) ? input : [input];

export const isNonEmptyArray = value => isArray(value) && !!length(value);
