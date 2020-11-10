import React from 'react'
import ReactDOM from 'react-dom'
import styled, {createGlobalStyle} from "styled-components"
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
    background-color: transparent;
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: 16px;
    line-height: 22px;
    padding: 22px;
  }
`

const Wrapper = styled.div`
  position: absolute;
  height: 100vh;
  width: 100vw;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Inner = styled.div`
  max-height: 100vh;
  height: 35rem;
  max-width: 100vw;
  width: 30rem;
  padding: 2rem;
  box-sizing: border-box;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  overflow-y: scroll;
  position: relative;
`

const DEBUG = process.env.REACT_APP_DEBUG || false;

const FourOhFour = () => <div>404</div>

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyle />
    <Wrapper>
      <Inner>
        <Router>
          <Route path="/local" component={LocalConfig} />
          <Route path="/testnet" component={TestnetConfig} />
          <Route path="/mainnet" component={MainnetConfig} />
          <Switch>
            <Route path="/local/authn" component={props => <Authn {...props} network="local" debug={DEBUG} />} exact />
            <Route path="/testnet/authn" component={props => <Authn {...props} network="testnet" debug={DEBUG} />} exact />
            <Route path="/mainnet/authn" component={props => <Authn {...props} network="mainnet" debug={DEBUG} />} exact />
            <Route path="/local/authz" component={props => <Authz {...props} network="local" debug={DEBUG} />} exact />
            <Route path="/testnet/authz" component={props => <Authz {...props} network="testnet" debug={DEBUG} />} exact />
            <Route path="/mainnet/authz" component={props => <Authz {...props} network="mainnet" debug={DEBUG} />} exact />
            <Route component={FourOhFour} />
          </Switch>
        </Router>
      </Inner>
    </Wrapper>
  </React.StrictMode>,
  document.getElementById('root')
);
