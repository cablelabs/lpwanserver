import React from 'react';
import PT from 'prop-types';
import FetchResources from './FetchResources';
import networkProtocolStore from "../../stores/NetworkProtocolStore";

//******************************************************************************
// Interface
//******************************************************************************

// This is a render prop component.  prop.render will be called
// when the fetch is complete, passing it the fetch results.

FetchNetworkProtocols.propTypes = {

  id: PT.string,
    // if provided, single networkProtocol fetched, passes {networkProtocol} to render.prop
    // if not provided, all networkProtocols fetched, passes [{networkProtocol}] to render.prop
  fitler: PT.func,
    // filter function to apply when fetching list
  render: PT.func
    // this funcion is called with results of the fetch
    // called as props.render({networkProtocol}), for single fetch,
    // called as props.render([{networkProtocol}]) for list fetch
};

//
// <FetchNetworkProtocols render={ networkProtocols =>
//    networkProtocols.map( networkProtocol => <div>{networkProtocol.name}</div> )
// }/>
//
// <FetchNetworkProtocols id={networkProtocolId} render={ networkProtocol =>
//    <div>{networkProtocol.name}</div> )
// }/>

//******************************************************************************
// Component
//******************************************************************************

export default function FetchNetworkProtocols(props) {
  const { id, render, filter } = props;
  return (
    <FetchResources
      {...{ id, render, filter }}
      fetchMethodName={ id ? 'getNetworkProtocol' : 'getNetworkProtocols' }
      fetcher={networkProtocolStore}
    />
  );
}
