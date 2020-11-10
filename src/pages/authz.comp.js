import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import {FaTimes} from "react-icons/fa"
import {useLocation} from "react-router-dom"
import {signTransaction} from "../ledger/ledger.js";
import {getKeyIdForKeyByAccountAddress} from "../flow/accounts.js";
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

const StyledClose = styled(FaTimes)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  height: 1rem;
`

export const Authz = ({ network = "local" }) => {
  const [id, setId] = useState(null)
  const [signable, setSignable] = useState("")
  const [paramsFromConfig, setParamsFromConfig] = useState(null)
  
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState(null);

  const handleCancel = () => {
    const msg = {
      jsonrpc: "2.0",
      id: id,
      result: {
        status: "DECLINED",
        reason: "Ledger device did not sign this transaction."
      },
    }
    window.parent.postMessage(msg, "*")
  }

  useEffect(() => {
    window.addEventListener("message", ({ data }) => {
      if (data.jsonrpc === "2.0" && data.method === "fcl:sign") {
        const [signable, paramsFromConfig] = data.params
        setId(data.id)

        setSignable(signable)
        setParamsFromConfig(paramsFromConfig)
      }
    })

    window.postMessage(
      {
        type: "FCL::AUTHZ_READY",
      },
      "*"
    )
  }, [])

  useEffect(() => {
      (async function getAddress() {
          if (!signable) return;          
          if (!account) return;

          const { address, publicKey } = account;

          if (!publicKey || !address) {
            setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
            return
          }

          setMessage("Please follow the instructions on your Ledger device.")

          const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)

          if (keyId === -1) {
            setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
            return
          }

          const signature = await signTransaction(signable.message);

          if (!signature) {
              const msg = {
                jsonrpc: "2.0",
                id: id,
                result: {
                  status: "DECLINED",
                  reason: "Ledger device did not sign this transaction."
                },
              }
              window.parent.postMessage(msg, "*")
              setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
              return;
          }

          setMessage("Signature: " + signature)

          const msg = {
            jsonrpc: "2.0",
            id: id,
            result: {
              status: "APPROVED",
              reason: null,
              compositeSignature: {
                addr: fcl.withPrefix(address),
                keyId: keyId,
                signature: signature,
              },
            },
          }

          window.parent.postMessage(msg, "*")
      })();
  }, [signable, account])

  return (
      <StyledContainer>
        <LedgerDevice account={account} onGetAccount={account => setAccount(account)} />
        <StyledMessage>{message}</StyledMessage>
      </StyledContainer>    
  )
}
