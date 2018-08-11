import React from 'react';
import PT from 'prop-types';
import { Link } from 'react-router-dom';

//******************************************************************************
// Interface
//******************************************************************************

const breadCrumbShape = {
  text: PT.string,  // text to show in the crumb
  to: PT.string     // link for the crumb
};

BreadCrumbs.propTypes = {
  trail: PT.arrayOf(PT.shape(breadCrumbShape)),
    // trail to the dest
  destination: PT.string
    // if supplied, displayed as final entry in the bread crumb list, without a link
};

BreadCrumbs.defaultProps = {
  trail: []
};


//******************************************************************************
// BreadCrumbs
//******************************************************************************

export default function BreadCrumbs({trail, destination}) {
  return (
    <ol className="breadcrumb">
      { trail.map((c,key)=>
        <li key={key}><Link to={c.to}>{c.text}</Link></li>)
      }
      { destination && <li className="active">{destination}</li> }
    </ol>
  );
}
