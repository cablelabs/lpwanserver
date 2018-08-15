import { isArray } from 'ramda-adjunct';

export const arrayify = input => isArray(input) ? input : [input];
