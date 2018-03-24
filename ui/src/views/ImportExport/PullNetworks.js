import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import { RingLoader } from 'react-spinners';


import networkTypeStore from "../../stores/NetworkTypeStore";

class PullNetworks extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            networkTypeId: this.props.match.params.networkTypeId
        };
        networkTypeStore.pullNetworkType(this.props.match.params.networkTypeId)
            .then( function() {
                this.setState({loading: false, error: false});
            })
            .catch(function(err) {
                this.setState({loading: false, error: true});
            })

    }

    const withErrorHandling = WrappedComponent => ({ showError, children }) => {
        return (
            <WrappedComponent>
                {showError && <div className="error-message">Error Importing from Network</div>}
                {children}
            </WrappedComponent>
        );
    };

    const DivWithErrorHandling = withErrorHandling(({children}) => <div>{children}</div>)


    render() {
        return (
            <DivWithErrorHandling showError={this.state.error}>
            <div>
                <ol className="breadcrumb">
                    <li><Link to={`/`}>Home</Link></li>
                    <li><Link to={`/admin/networks`}>Networks</Link></li>
                </ol>
              <div className={`panel-body clearfix `}>
                <table className="table table-hover">
                    <tbody>
                <tr>
                  <td><RingLoader
                      color={'#123abc'}
                      loading={this.state.loading}
                  /></td>
                  <td>
                    <p>Importing data from network server ${this.state.networkTypeId}, please wait.</p>
                  </td>
                </tr>
                    </tbody>
              </table>
              </div>
            </div>
            </DivWithErrorHandling>
        )
    }


}

export default PullNetworks;
