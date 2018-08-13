import React from 'react';
import PT from 'prop-types';
import FetchResources from './FetchResources';
import networkTypeStore from "../../stores/NetworkTypeStore";

//******************************************************************************
// Interface
//******************************************************************************

// This is a render prop component.  prop.render will be called
// when the fetch is complete, passing it the fetch results.

FetchNetworkTypes.propTypes = {

  id: PT.string,
    // if provided, single networkType fetched, passes {networkType} to render.prop
    // if not provided, all networkTypes fetched, passes [{networkType}] to render.prop
  fitler: PT.func,
    // filter function to apply when fetching list
  render: PT.func
    // this funcion is called with results of the fetch
    // called as props.render({networkType}), for single fetch,
    // called as props.render([{networkType}]) for list fetch
};

//
// <FetchNetworkTypes render={ networkTypes =>
//    networkTypes.map( networkType => <div>{networkType.name}</div> )
// }/>
//
// <FetchNetworkTypes id={networkTypeId} render={ networkType =>
//    <div>{networkType.name}</div> )
// }/>

//******************************************************************************
// Component
//******************************************************************************

export default function FetchNetworkTypes(props) {
  const { id, render, filter } = props;
  return (
    <FetchResources
      {...{ id, render, filter }}
      fetchMethodName={ id ? 'getNetworkType' : 'getNetworkTypes' }
      fetcher={networkTypeStore}
    />
  );
}
