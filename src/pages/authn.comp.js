import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import {useLocation} from "react-router-dom"
import {getKeyIdForKeyByAccountAddress} from "../flow/accounts";
import LedgerDevice from '../components/LedgerDevice';

const StyledContainer = styled.div`
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledMessage = styled.div`
    font-size: 1rem;
    text-align: center;
`

export const Authn = ({ network = "local" }) => {
    const [account, setAccount] = useState(null);
    const [serviceConfig, setServiceConfig] = useState(null)
    const [appConfig, setAppConfig] = useState(null)

    const handleCancel = () => {
      fcl.WalletUtils.sendMsgToFCL("FCL:VIEW:CLOSE")
    }

    useEffect(() => {
      fcl.WalletUtils.onMessageFromFCL("FCL:VIEW:READY:RESPONSE", (data) => {
        console.log("FCL:VIEW:READY:RESPONSE", JSON.parse(JSON.stringify(data)))
        if (data.type === "FCL:VIEW:READY:RESPONSE") {
          setServiceConfig(data.config.service)
          setAppConfig(data.config.app)
        }
      })
  
      fcl.WalletUtils.sendMsgToFCL("FCL:VIEW:READY")
    }, [])

    useEffect(() => {
        (async function getAddress() {
            if (!account) return;

            const { address, publicKey } = account;

            if (!publicKey || !address) {
              return
            }

            const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)

            fcl.WalletUtils.approve({
              f_type: "AuthnResponse",
              f_vsn: "1.0.0",
              addr: fcl.withPrefix(address),  
              services: [      
                {
                  f_type: "Service",
                  f_vsn: "1.0.0",
                  type: "authz",
                  method: "IFRAME/RPC",
                  uid: "fcl-ledger-authz",
                  endpoint: `${window.location.origin}/${network}/authz`,
                  identity: {
                    f_type: "Identity",
                    f_vsn: "1.0.0",
                    address: fcl.withPrefix(address),
                    keyId: keyId,
                  },
                  data: {},
                  params: {}
                },
                {
                  f_type: "Service",
                  f_vsn: "1.0.0",
                  type: "authn",
                  method: "DATA",
                  uid: "fcl-ledger-authn",
                  endpoint: `${window.location.origin}/${network}/authn`,
                  id: fcl.withPrefix(address),
                  identity: {
                    f_type: "Identity",
                    f_vsn: "1.0.0",
                    address: fcl.withPrefix(address),
                    keyId: keyId,
                  },
                  provider: {
                    f_type: "ServiceProvider",                
                    f_vsn: "1.0.0",                          
                    address: "0xPLACEHOLDER",                
                  },
                },
              ]
            })
        })();
    }, [account])

    return (
        <StyledContainer>
            <LedgerDevice account={account} onGetAccount={account => setAccount(account)} handleCancel={handleCancel} />
        </StyledContainer>    
    )
}
