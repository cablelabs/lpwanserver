import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import { RingLoader } from 'react-spinners';


import companyStore from "../../stores/CompanyStore";
import networkStore from "../../stores/NetworkStore";

class PullNetworks extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            networkTypeId: this.props.match.params.networkTypeId
        }
    }
    render() {
        return (
            <div>
                <ol className="breadcrumb">
                    <li><Link to={`/`}>Home</Link></li>
                    <li><Link to={`/admin/networks`}>Networks</Link></li>
                </ol>
              <div className={`panel-body clearfix `}>
                <table className="table table-hover">
                <tr>
                  <td><RingLoader
                      color={'#123abc'}
                      loading={this.state.loading}
                  /></td>
                  <td>
                    <p>Importing data from network server ${this.state.networkTypeId}, please wait.</p>
                  </td>
                </tr>
              </table>
              </div>
            </div>
        )
    }
}

export default PullNetworks;
