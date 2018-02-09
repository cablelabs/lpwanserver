import React from 'react';
import ReactDOM from 'react-dom';


import Layout from "./App";

//import { Router, Route, IndexRoute } from 'react-router';
import {BrowserRouter, Route/*, NavLink*/} from 'react-router-dom';

//import Leaflet from 'leaflet';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootswatch/paper/bootstrap.css';
import 'react-select/dist/react-select.css';
import 'leaflet/dist/leaflet.css';
import './index.css';

ReactDOM.render(
  <BrowserRouter>
    <Route path="/" component={Layout}/>
  </BrowserRouter>,
  document.getElementById('root')
);
