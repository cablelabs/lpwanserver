// A null fetcher for render prop cases
import React from 'react';
import { isFunction } from 'ramda-adjunct';

export default function FetchNothing(props) {
  return (
  <div>
    { isFunction(props.render) && props.render() }
  </div>
);}
