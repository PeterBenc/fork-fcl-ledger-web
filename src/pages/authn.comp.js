import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import {useLocation} from "react-router-dom"
import {getKeyIdForKeyByAccountAddress} from "../flow/accounts";
import LedgerDevice from '../components/LedgerDevice';

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`

const StyledMessage = styled.div`
    font-size: 1rem;
    text-align: center;
`

export const Authn = ({ network = "local" }) => {
    const [account, setAccount] = useState(null);

    const handleCancel = () => {
      window.parent.postMessage({
        type: "FCL::CHALLENGE::CANCEL"
      }, "*")
    }

    useEffect(() => {
        (async function getAddress() {
            if (!account) return;

            const { address, publicKey } = account;

            if (!publicKey || !address) {
              return
            }

            const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)

            const msg = {
              type: "FCL::CHALLENGE::RESPONSE",
              addr: fcl.withPrefix(address),  
              paddr: null,    
              hks: null,       
              code: null,      
              services: [      
                {
                  type: "authz",
                  method: "IFRAME/RPC",
                  id: "fcl-ledger-authz",
                  addr: fcl.withPrefix(address),
                  keyId: keyId,
                  endpoint: `${window.location.origin}/${network}/authz`,
                  params: {
                    address: fcl.withPrefix(address),
                    keyId: keyId,
                    sessionId: "UXfZXdUzU",
                  },
                },
                {
                  type: "authn",
                  addr: null,
                  pid: fcl.withPrefix(address),
                  id: "fcl-ledger-authn",
                  name: "Flow Ledger",
                  authn: `${window.location.origin}/${network}/authn`,
                  icon: "",
                },
              ],
            }

            window.parent.postMessage(msg, "*")
        })();
    }, [account])

    return (
        <StyledContainer>
            <LedgerDevice account={account} setMessage={setMessage} onGetAccount={account => setAccount(account)} handleCancel={handleCancel} />
        </StyledContainer>    
    )
}
