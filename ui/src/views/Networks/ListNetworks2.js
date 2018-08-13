import React from 'react';
import { isNotArray } from 'ramda-adjunct';
import BreadCrumbs from '../../components/BreadCrumbs';
import FetchNetworkTypes from '../../components/fetch/FetchNetworkTypes';
import NetworkTypeView from './networkViews/NetworkTypeView';


export default function ListNetworks() {

  const breadCrumbs = [
    { to: `/`, text: 'Home' },
    { to: `/admin/networks2`, text: 'Networks' },
  ];

  return(
    <div>
      <BreadCrumbs trail={breadCrumbs}/>
      <FetchNetworkTypes
       render={ networkTypes =>
         isNotArray(networkTypes) ?
         <div></div> :
         networkTypes.map((networkType,key) =>
           <NetworkTypeView
             {...{networkType, key}} first={key===0}
           />
         )
      }/>
    </div>

  );
}
