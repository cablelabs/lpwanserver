import React from 'react';
import PT from 'prop-types';
import FetchResources from './FetchResources';
import networkStore from "../../stores/NetworkStore";

//******************************************************************************
// Interface
//******************************************************************************

// This is a render prop component.  prop.render will be called
// when the fetch is complete, passing it the fetch results.

FetchNetworks.propTypes = {

  id: PT.string,
    // if provided, single network fetched, passes {network} to render.prop
    // if not provided, all networks fetched, passes [{network}] to render.prop
  fitler: PT.func,
    // filter function to apply when fetching list
  render: PT.func
    // this funcion is called with results of the fetch
    // called as props.render({network}), for single fetch,
    // called as props.render([{network}]) for list fetch
};

//
// <FetchNetworks render={ networks =>
//    networks.map( network => <div>{network.name}</div> )
// }/>
//
// <FetchNetworks id={networkId} render={ network =>
//    <div>{network.name}</div> )
// }/>

//******************************************************************************
// Component
//******************************************************************************

export default function FetchNetworks(props) {
  const { id, render, filter } = props;
  return (
    <FetchResources
      {...{ id, render, filter }}
      fetchMethodName={ id ? 'getNetwork' : 'getNetworks' }
      fetcher={networkStore}
    />
  );
}
