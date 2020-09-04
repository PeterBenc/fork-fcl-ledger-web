import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {useLocation} from "react-router-dom"
import {getKeyIdForKeyByAccountAddress} from "../flow/accounts";
import LedgerDevice from '../components/LedgerDevice';

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const StyledMessage = styled.div`
    font-size: 1rem;
    text-align: center;
`

export const Authn = () => {
    const l6n = new URLSearchParams(useLocation().search).get("l6n")
    const [message, setMessage] = useState("");
    const [account, setAccount] = useState(null);

    useEffect(() => {
        (async function getAddress() {
            if (!account) return;

            const { address, publicKey } = account;

            setMessage("Please follow the instructions on your Ledger device.")

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
    }, [account])

    return (
        <StyledContainer>
            <LedgerDevice account={account} onGetAccount={account => setAccount(account)} />
            <StyledMessage>{message}</StyledMessage>
        </StyledContainer>    
    )
}
