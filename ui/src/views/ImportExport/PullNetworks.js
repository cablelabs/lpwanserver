import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {RingLoader} from 'react-spinners';
import FaCheck from 'react-icons/fa/check';

import networkTypeStore from "../../stores/NetworkTypeStore";

class PullNetworks extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            errorMsg: '',
            networkTypeId: this.props.match.params.networkTypeId
        };
        networkTypeStore.pullNetworkType(this.props.match.params.networkTypeId)
            .then(() => {
                this.setState({loading: false, error: false});
            })
            .catch(error => {
                console.log(error);
                this.setState({loading: false, error: true, errorMsg: error.toString()});
            })

    }


    render() {
        const processing = this.state.loading;

        const msg = processing ? (
            <table className="table table-hover">
                <tbody>
                <tr>
                    <td><RingLoader
                        color={'#123abc'}
                        loading={this.state.loading}
                    /></td>
                    <td>
                        <p >Importing data from network server, please wait.</p>
                    </td>
                </tr>
                </tbody>
            </table>
        ): (
            <table className="table table-hover">
                <tbody>
                <tr>
                    <td>                        <p >Importing from network server complete.</p>
                    </td>
                    <td>
                    </td>
                </tr>
                </tbody>
            </table>
        )

        return (
            <div>{this.state.error && <div>Error Importing Data from Network Server: {this.state.errorMsg}</div>}
                <div>
                    <ol className="breadcrumb">
                        <li><Link to={`/`}>Home</Link></li>
                        <li><Link to={`/admin/networks`}>Networks</Link></li>
                    </ol>
                    <div className={`panel-body clearfix `}>
                        {msg}
                    </div>
                </div>
            </div>
        )
    }


}

export default PullNetworks;
