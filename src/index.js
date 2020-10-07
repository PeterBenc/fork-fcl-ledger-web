import React from 'react'
import ReactDOM from 'react-dom'
import {createGlobalStyle} from "styled-components"
import * as fcl from "@onflow/fcl"
import * as types from "@onflow/types"
import {BrowserRouter as Router, Route, Switch} from "react-router-dom"
import {LocalConfig} from "./config/local.config"
import {TestnetConfig} from "./config/testnet.config"
import {MainnetConfig} from "./config/mainnet.config"
import {Authn} from "./pages/authn.comp"
import {Authz} from "./pages/authz.comp"

window.fcl = fcl
window.types = types

const GlobalStyle = createGlobalStyle`
  * { 
    margin:0;
    padding:0;
    font-variant-ligatures: common-ligatures;
  }
  :root {
    --text-primary: #0F0F0F;
    --text-secondary: #0B0B0B;
    --font-family:"Inter",sans-serif;
  }
  body {
    background-color: white;
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: 16px;
    line-height: 22px;
    padding: 22px;
  }
`

const FourOhFour = () => <div>404</div>

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyle />
    <Router>
      <Route path="/local" component={LocalConfig} />
      <Route path="/testnet" component={TestnetConfig} />
      <Route path="/mainnet" component={MainnetConfig} />
      <Switch>
        <Route path="/local/authn" component={props => <Authn {...props} network="local"/>} exact />
        <Route path="/testnet/authn" component={props => <Authn {...props} network="testnet"/>} exact />
        <Route path="/mainnet/authn" component={props => <Authn {...props} network="mainnet"/>} exact />
        <Route path="/local/authz" component={props => <Authz {...props} network="local" />} exact />
        <Route path="/testnet/authz" component={props => <Authz {...props} network="testnet" />} exact />
        <Route path="/mainnet/authz" component={props => <Authz {...props} network="mainnet" />} exact />
        <Route component={FourOhFour} />
      </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
