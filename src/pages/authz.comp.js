import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {useLocation} from "react-router-dom"
import {getPublicKey, signTransaction} from "../ledger/ledger.js"
import {getOrCreateAccount, getKeyIdForKeyByAccountAddress} from "../flow/accounts";

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

const u8ToHex = u8 => Buffer.from(u8).toString("hex")

export const Authz = () => {
  const l6n = new URLSearchParams(useLocation().search).get("l6n");
  const [signable, setSignable] = useState("f90256f9022eb90195696d706f72742046756e6769626c65546f6b656e2066726f6d203078656538323835366266323065326161360a7472616e73616374696f6e28616d6f756e743a205546697836342c20746f3a204164647265737329207b0a6c6574207661756c743a204046756e6769626c65546f6b656e2e5661756c740a70726570617265287369676e65723a20417574684163636f756e7429207b0a73656c662e7661756c74203c2d207369676e65720a2e626f72726f773c267b46756e6769626c65546f6b656e2e50726f76696465727d3e2866726f6d3a202f73746f726167652f666c6f77546f6b656e5661756c7429210a2e776974686472617728616d6f756e743a20616d6f756e74290a7d0a65786563757465207b0a6765744163636f756e7428746f290a2e6765744361706162696c697479282f7075626c69632f666c6f77546f6b656e526563656976657229210a2e626f72726f773c267b46756e6769626c65546f6b656e2e52656365697665727d3e2829210a2e6465706f7369742866726f6d3a203c2d73656c662e7661756c74290a7d0a7df854a37b2274797065223a22554669783634222c2276616c7565223a22333431362e3435227daf7b2274797065223a2241646472657373222c2276616c7565223a22307866386436653035383662306132306337227da0f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b2a88f8d6e0586b0a20c7040a88f8d6e0586b0a20c7c988f8d6e0586b0a20c7e4e38004a0f7225388c1d69d57e6251c9fda50cbbf9e05131e5adb81e5aa0422402f048162")
  const [paramsFromConfig, setParamsFromConfig] = useState(null)
  const [message, setMessage] = useState("Please connect and unlock your Ledger device, open the Flow app and then press start.")
  const [hasUserStarted, setHasUserStarted] = useState(false);

  useEffect(() => {
    window.addEventListener("message", ({ data }) => {
      if (data.jsonrpc === "2.0" && data.method === "fcl:sign") {
        const [signable, paramsFromConfig] = data.params

        setSignable(signable)
        setParamsFromConfig(paramsFromConfig)
      }
    })
  }, [])

  useEffect(() => {
      (async function getAddress() {
          if (!hasUserStarted) return;
          if (!signable) {
            setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
            setHasUserStarted(false)
            return
          }

          setMessage("Please follow the instructions on your Ledger device.");

          const publicKey = await getPublicKey()
          const address = await getOrCreateAccount(publicKey)

          if (!publicKey || !address) {
            setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
            setHasUserStarted(false)
            return
          }

          setMessage("Address: " + address)

          const keyId = await getKeyIdForKeyByAccountAddress(address, publicKey)


          if (keyId === -1) {
            setMessage("Please connect and unlock your Ledger device, open the Flow app and then press start.")
            setHasUserStarted(false)
            return
          }

          const signature = u8ToHex((await signTransaction(signable)).signatureDER)

          setMessage("Signature: " + signature)

          const msg = {
            jsonrpc: "2.0",
            id: "fcl-ledger-authz",
            result: {
              addr: address,
              keyId: keyId,
              signature: signature, 
            },
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


const msg = {
  jsonrpc: "2.0",
  id: "asdf",
  result: {
    addr: "ba1132bc08f82fe2",
    keyId: 1,
    signature: "asdfasdfasdfasdfasdfasdfasdfasdfasdfasdf", // hex
  },
}
