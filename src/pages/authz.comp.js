import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import {
  encodeTransactionPayload,
  encodeTransactionEnvelope
} from "@onflow/encode"
import {useLocation} from "react-router-dom"
import {signTransaction} from "../ledger/ledger.js";
import {getKeyIdForKeyByAccountAddress} from "../flow/accounts.js";
import LedgerDevice from '../components/LedgerDevice';

const StyledContainer = styled.div`
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledMessageWrapper = styled.div`
  width: 100%;
  font-size: 1rem;
  text-align: center;
`

const StyledMessage = styled.div`
  min-height: 4rem;
`

const StyledErrorMesssage = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  color: white;
  background-color: #FC4C2E;
  box-sizing: border-box;
`

const DEFAULT_MESSAGE = "Please connect and unlock your Ledger device, open the Flow app and then press start."
const ADDRESS_MISMATCH_MESSAGE = 
<StyledErrorMesssage>
  The Flow account detected from your Ledger doesn't match whats expected from the transaction. Please ensure the passphrase you used to unlock your Ledger is the same as the one used when authenticating with this application.
  <br/><br/>
  Please connect and unlock your Ledger device, open the Flow app and then press start.
</StyledErrorMesssage>

export const Authz = ({ network = "local" }) => {
  const [id, setId] = useState(null)
  const [signable, setSignable] = useState("")
  const [paramsFromConfig, setParamsFromConfig] = useState(null)
  
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState(null);

  const handleCancel = () => {
    setMessage(DEFAULT_MESSAGE)
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

    window.parent.postMessage(
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
            setMessage(DEFAULT_MESSAGE)
            return
          }

          setMessage("Please follow the instructions on your Ledger device.")

          const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)

          if (keyId === -1) {
            setMessage(DEFAULT_MESSAGE)
            return
          }

          let signature;

          console.log("SIGNABLE: ", signable)

          if (signable.voucher) {
            const findPayloadSigners = (ix) => {
              // Payload Signers Are: (authorizers + proposer) - payer
              let payload = new Set(ix.authorizations)
              payload.add(ix.proposer)
              payload.delete(ix.payer)
              return Array.from(payload).map(i => fcl.withPrefix(ix.accounts[i].addr))
            }
            
            const findEnvelopeSigners = (ix) => {
              // Envelope Signers Are: (payer)
              let envelope = new Set([ix.payer])
              return Array.from(envelope).map(i => fcl.withPrefix(ix.accounts[i].addr))
            }
  
            let payloadSigners = findPayloadSigners(signable.interaction)
            let envelopeSigners = findEnvelopeSigners(signable.interaction)
  
            const isPayloadSigner = payloadSigners.includes(fcl.withPrefix(address))
            const isEnvelopeSigner = envelopeSigners.includes(fcl.withPrefix(address))
  
            if (!isPayloadSigner && !isEnvelopeSigner) {
              setMessage(ADDRESS_MISMATCH_MESSAGE)
              setAccount(null)
              return;
            }
  
            signature = isPayloadSigner ? 
              await signTransaction(
                encodeTransactionPayload(
                  {
                    script: signable.voucher.cadence,
                    refBlock: signable.voucher.refBlock,
                    gasLimit: signable.voucher.computeLimit,
                    arguments: signable.voucher.arguments,
                    proposalKey: {
                      ...signable.voucher.proposalKey,
                      address: fcl.sansPrefix(signable.voucher.proposalKey.address)
                    },
                    payer: fcl.sansPrefix(signable.voucher.payer),
                    authorizers: signable.voucher.authorizers.map(fcl.sansPrefix)
                  }
                )
              )
              :
              await signTransaction(
                encodeTransactionEnvelope(
                  {
                    script: signable.voucher.cadence,
                    refBlock: signable.voucher.refBlock,
                    gasLimit: signable.voucher.computeLimit,
                    arguments: signable.voucher.arguments,
                    proposalKey: {
                      ...signable.voucher.proposalKey,
                      address: fcl.sansPrefix(signable.voucher.proposalKey.address)
                    },
                    payer: fcl.sansPrefix(signable.voucher.payer),
                    authorizers: signable.voucher.authorizers.map(fcl.sansPrefix),
                    payloadSigs: signable.voucher.payloadSigs
                  }
                )
              )
          } else {
            signature = await signTransaction(signable.message)
          }

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
        <LedgerDevice account={account} onGetAccount={account => setAccount(account)} handleCancel={handleCancel} />
        <StyledMessageWrapper>{ message && <StyledMessage>{message}</StyledMessage> }</StyledMessageWrapper>
      </StyledContainer>    
  )
}
