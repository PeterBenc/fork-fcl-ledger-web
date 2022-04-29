import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
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

const StyledAlertMessage = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
  min-height: 3rem;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  color: white;
  background-color: #FC4C2E;
  box-sizing: border-box;
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
  The Flow account saved to your Ledger device does not match the account that is expected by the transaction.
  <br/><br/>
  Please ensure the passphrase you used to unlock your Ledger is the same as the one used when authenticating with this application and try again.
</StyledErrorMesssage>

export const Authz = ({ location, network = "local" }) => {
  const [signable, setSignable] = useState("")
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState(null);
  
  const qp = new URLSearchParams(location.search)
  const authnAddress = qp.get("address")

  const handleCancel = () => {
    fcl.WalletUtils.close()
  }

  useEffect(() => {
    const unmount = fcl.WalletUtils.onMessageFromFCL("FCL:VIEW:READY:RESPONSE", (data) => {
      const _signable = data.body
      setSignable(_signable)
    })

    fcl.WalletUtils.sendMsgToFCL("FCL:VIEW:READY")

    return unmount
  }, [])

  useEffect(() => {
      (async function getAddress() {
          if (!signable) return;
          if (!account) return;

          const { address, publicKey, path } = account;

          console.log("PRE SIG => ", account)

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

          if (signable.voucher) {
            // const findPayloadSigners = (voucher) => {
            //   // Payload Signers Are: (authorizers + proposer) - payer
            //   let payload = new Set(voucher.authorizers)
            //   payload.add(voucher.proposalKey.address)
            //   payload.delete(voucher.payer)
            //   return Array.from(payload).map(fcl.withPrefix)
            // }

            // const findEnvelopeSigners = (voucher) => {
            //   // Envelope Signers Are: (payer)
            //   let envelope = new Set([voucher.payer])
            //   return Array.from(envelope).map(fcl.withPrefix)
            // }

            // let payloadSigners = findPayloadSigners(signable.voucher)
            // let envelopeSigners = findEnvelopeSigners(signable.voucher)


            // const isPayloadSigner = payloadSigners.includes(fcl.withPrefix(address))
            // const isEnvelopeSigner = envelopeSigners.includes(fcl.withPrefix(address))

            // if (!isPayloadSigner && !isEnvelopeSigner) {
            //   setMessage(ADDRESS_MISMATCH_MESSAGE)
            //   setAccount(null)
            //   return;
            // }

            const message = fcl.WalletUtils.encodeMessageFromSignable(signable, fcl.withPrefix(signable.address)).substring(64)
  
            signature = await signTransaction(message, path, 0x0201)
          }

          if (!signature) {
              fcl.WalletUtils.decline("Ledger device did not sign this transaction.")
              setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
              return;
          }

          setMessage("Signature: " + signature)

          fcl.WalletUtils.approve(
            new fcl.WalletUtils.CompositeSignature(
              fcl.withPrefix(address),
              keyId,
              signature
            )
          )
      })();
  }, [signable, account])

  return (
      <StyledContainer>
        {process.env.REACT_APP_ALERT_MESSAGE && <StyledAlertMessage dangerouslySetInnerHTML={{__html: process.env.REACT_APP_ALERT_MESSAGE}}/>}
        <LedgerDevice 
          account={account}
          authnAddress={authnAddress}
          network={network}
          onGetAccount={setAccount}
          handleCancel={handleCancel} 
        />
        <StyledMessageWrapper>{ message && <StyledMessage>{message}</StyledMessage> }</StyledMessageWrapper>
      </StyledContainer>
  )
}
