import React from 'react'
import ReactDOM from 'react-dom'
import * as fcl from "@onflow/fcl"
import * as types from "@onflow/types"
import {BrowserRouter as Router, Route, Switch} from "react-router-dom"
import {Authn} from './pages/authn.comp'
import {Authz} from "./pages/authz.comp"

window.fcl = fcl
window.types = types

const FourOhFour = () => <div>404</div>

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path="/authn" component={Authn} exact />
        <Route path="/authz" component={Authz} exact />
        <Route component={FourOhFour} />
      </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
