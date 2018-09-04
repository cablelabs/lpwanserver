import React from 'react';
import { isNotArray } from 'ramda-adjunct';
import BreadCrumbs from '../../components/BreadCrumbs';
import FetchNetworkTypes from '../../components/fetch/FetchNetworkTypes';
import NetworkType from './containers/NetworkType';
import networkGroupStore from "../../stores/NetworkGroupStore";

const breadCrumbs = [
  { to: `/`, text: 'Home' },
  { to: `/admin/networks`, text: 'Networks' },
];

export default class ListNetworks extends React.Component {
  componentDidMount () {
    networkGroupStore.getNetworkGroups()
  }
  render () {
    return(
      <div>
        <BreadCrumbs trail={breadCrumbs}/>
        <FetchNetworkTypes
         render={ networkTypes =>
           isNotArray(networkTypes) ?
           <div></div> :
           networkTypes.map((networkType,key) =>
             <NetworkType
               {...{networkType, key}} first={key===0}
             />
           )
        }/>
      </div>
    );
  }
}
