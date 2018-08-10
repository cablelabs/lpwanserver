import React from 'react';
import PT from 'prop-types';
import { prop, propOr } from 'ramda';
import { isFunction, isArray, noop } from 'ramda-adjunct';

//******************************************************************************
// Interface
//******************************************************************************

// this is the base fetch render prop component

const propTypes = {
  id: PT.string,              // if supplied, will be passed into fetchMethod (for single resource fetch)
  fetcher: PT.object,         // resorce fetch object
  fetchMethodName: PT.string, // name of the fetch method on fetcher object
  fitler: PT.func,            // filter function to apply when fetching list
  render: PT.func             // function to call with fetch results data, sig::render(fetchedResources)
};

const defaultProps = {
  filter: ()=>true,
  render: noop,
};

//******************************************************************************
// Component
//******************************************************************************

export default class FetchResources extends React.Component {

  constructor(props, ...rest) {
    super(props, ...rest);
    this.state = { fetchResults: props.id ? {} : [] };
  }

  componentDidMount() {
    const { fetcher, filter, fetchMethodName, id } = this.props;
    fetcher && fetchMethodName &&
    fetcher[fetchMethodName](id).then( response => this.setState({
      fetchResults : id ? response : // returning single resource
      prop('records', response) ?    // list may or may not be on a records prop
        propOr([], 'records', response).filter(filter) :
        isArray(response) ? response.filter(filter) : []
    }));
  }

  render = () =>
    <div>
      {
        isFunction(this.props.render) &&
        this.props.render(this.state.fetchResults)
      }
    </div>
}

FetchResources.propTypes = propTypes;
FetchResources.defaultProps = defaultProps;
