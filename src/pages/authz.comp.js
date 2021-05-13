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
  height: 4rem;
`

export const Authz = ({ network = "local" }) => {
  const [id, setId] = useState(null)
  const [signable, setSignable] = useState("")
  const [paramsFromConfig, setParamsFromConfig] = useState(null)
  
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState(null);

  const handleCancel = () => {
    setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
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
            setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
            return
          }

          setMessage("Please follow the instructions on your Ledger device.")

          const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)

          if (keyId === -1) {
            setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
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
              const msg = {
                jsonrpc: "2.0",
                id: id,
                result: {
                  status: "DECLINED",
                  reason: "Could not determine whether to produce payload or envelope signature."
                },
              }
              window.parent.postMessage(msg, "*")
              setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
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
