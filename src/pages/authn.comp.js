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
    const [message, setMessage] = useState("");
    const [account, setAccount] = useState(null);

    useEffect(() => {
        (async function getAddress() {
            if (!account) return;

            const { address, publicKey } = account;

            if (!publicKey || !address) {
              setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
              return
            }

            setMessage("Please follow the instructions on your Ledger device.")

            const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)

            const msg = {
              type: "FCL::CHALLENGE::RESPONSE",
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
                  endpoint: `${window.location.origin}/local/authz`,
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
                  authn: `${window.location.origin}/local/authn`,
                  icon: "",
                },
              ],
            }

            window.parent.postMessage(msg, "*")
        })();
    }, [account])

    return (
        <StyledContainer>
            <LedgerDevice account={account} onGetAccount={account => setAccount(account)} />
            <StyledMessage>{message}</StyledMessage>
        </StyledContainer>    
    )
}
