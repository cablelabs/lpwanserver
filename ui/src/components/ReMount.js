import React from 'react';
import PT from 'prop-types';
import { withRouter } from 'react-router';
import qs from 'query-string';
import { propOr, pathOr } from 'ramda';

//
// forces a ReMount of a component
// expects query param `to=path-to-reroute-to'
//

//******************************************************************************
// Component
//******************************************************************************

class ReMount extends React.Component {

  static contextTypes = {
    router: PT.object.isRequired
  };

  componentDidMount() {
    const queryParams = qs.parse(pathOr({}, [ 'location', 'search' ], this.props));
    const to = propOr('', 'to', queryParams);
    to && this.props.history.push(to);
  }

  render = () => <div></div>;
}

export default withRouter(ReMount);
