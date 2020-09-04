import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {useLocation} from "react-router-dom"
import {getKeyIdForKeyByAccountAddress} from "../flow/accounts";
import {getAccount} from "../integration/integration.js";

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const StyledTitle = styled.div`
    font-size: 2rem;
    text-decoration: underline;
    text-align: center;
`

const StyledSubtitle = styled.div`
    margin-top: 2rem;
    font-size: 1rem;
    text-align: center;
`

const StyledButton = styled.button`
  -webkit-appearance: none;
  -moz-appearance: none;
  margin-top: 2rem;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem 1rem 2rem;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
`

export const Authn = () => {
    const l6n = new URLSearchParams(useLocation().search).get("l6n")
    const [message, setMessage] = useState("Please connect and unlock your Ledger device, open the Flow app and then press start.")
    const [hasUserStarted, setHasUserStarted] = useState(false)

    useEffect(() => {
        (async function getAddress() {
            if (!hasUserStarted) return;

            setMessage("Please follow the instructions on your Ledger device.");

            const { address, publicKey } = await getAccount();

            if (!publicKey || !address) {
              setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
              setHasUserStarted(false)
              return
            }
 
            setMessage("Address: " + address)

            const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)

            const msg = {
              addr: address,  
              paddr: null,    
              hks: null,       
              code: null,      
              services: [      
                {
                  type: "authz",
                  method: "IFRAME/RPC",
                  id: "fcl-ledger-authz",
                  addr: address,
                  keyId: keyId,
                  endpoint: `${window.location.hostname}/local/authz`,
                  params: {
                    address: address,
                    keyId: keyId,
                    sessionId: "UXfZXdUzU",
                  },
                },
                {
                  type: "authn",
                  addr: address,
                  pid: address,
                  id: "fcl-ledger-authn",
                  name: "Flow Ledger",
                  authn: `${window.location.hostname}/local/authn`,
                  icon: "",
                },
              ],
            }

            window.parent.postMessage(msg, msg.l6n)
        })();
    }, [hasUserStarted])

    return (
        <StyledContainer>
            <StyledTitle>Ledger Flow</StyledTitle>
            <StyledSubtitle>{message}</StyledSubtitle>
            {!hasUserStarted && <StyledButton onClick={() => setHasUserStarted(true)}>Start</StyledButton>}
        </StyledContainer>    
    )
}
