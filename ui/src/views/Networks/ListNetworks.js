import React from 'react';
import { isNotArray } from 'ramda-adjunct';
import BreadCrumbs from '../../components/BreadCrumbs';
import FetchNetworkTypes from '../../components/fetch/FetchNetworkTypes';
import NetworkType from './containers/NetworkType';
import networkStore from "../../stores/NetworkStore";

const breadCrumbs = [
  { to: `/`, text: 'Home' },
  { to: `/admin/networks`, text: 'Networks' },
];

export default class ListNetworks extends React.Component {
  componentDidMount () {
    networkStore.getNetworkGroups()
  }
  render () {
    return(
      <div>
        <BreadCrumbs trail={breadCrumbs}/>
        <FetchNetworkTypes
          render={ networkTypes =>
            isNotArray(networkTypes) ?
            <div></div> :
            networkTypes.map((x, i) =>
              <NetworkType networkType={x} key={x.id} first={i===0} />
            )
          }
        />
      </div>
    );
  }
}
