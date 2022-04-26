import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import semver from "semver"
import FlowLogo from "../images/logo.svg";
import LedgerDevice from '../components/LedgerDevice';
import {showAddressAndPubKey, getVersion} from "../ledger/ledger.js";
import {
  INITIAL_PK_MESSAGE,
  VIEW_PK_MESSAGE,
  CONNECTING_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  VERSION_ERROR_MESSAGE
} from "../common/messages.js"
import {
  Button,
  Centered,
  Row,
  LedgerTitle,
  LedgerImage,
  Text,
  Error,
} from "../common/common.js"

const StyledContainer = styled.div`
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`

export const ShowKey = ({ network }) => {
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleShowKey = async () => {
    setMessage(null)
    setError(null)

    console.log("ShowKey account=", account)

    if (!account) return;

    const { address, publicKey, path } = account;

    try {
      let appVersion = await getVersion();

      if (!(semver.gte(appVersion, process.env.REACT_APP_FLOW_APP_VERSION))) {
        setError(VERSION_ERROR_MESSAGE)
        return
      }

      if (error === CONNECTION_ERROR_MESSAGE) {
        setError(null);
      }
    } catch(e) {
      console.error(e)
      setError(CONNECTION_ERROR_MESSAGE)
      return
    }

    try {
      setMessage(VIEW_PK_MESSAGE)

      await showAddressAndPubKey(path, 0x0201)
    } catch(e) {
      console.error(e)
      setMessage(null)
      return
    }
  }

  useEffect(() => {
    handleShowKey()
  }, [account])

  return (
      <StyledContainer>
        {/* <Centered>
            <Row><LedgerImage src={FlowLogo} /><LedgerTitle>Ledger</LedgerTitle></Row>
            { error && <Error>{ error }</Error> }
            { message && !error && <Text>{ message }</Text>}
        </Centered> */}
        <LedgerDevice
          account={account}
          network={network}
          onGetAccount={setAccount}
          handleCancel={() => setAccount(null)} 
        />
        <Centered>
          { message && !error && <Text>{ message }</Text>}
        </Centered>
      </StyledContainer>    
  )
}
