import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import semver from "semver"
import FlowLogo from "../images/logo.svg";
import {getAccount, createAccount} from "../flow/accounts";
import {
  getVersion as getVersionOnDevice,
  getAddressAndPublicKey as getAddressAndPublicKeyOnDevice, 
  setAddress as setAddressOnDevice,
  clearAddress as clearAddressOnDevice,
} from "../ledger/ledger.js";
import {
  CONNECTING_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  VERSION_ERROR_MESSAGE
} from "../common/messages.js"
import {
  Button,
  Column,
  Centered,
  Row,
  LedgerTitle,
  LedgerImage,
  Text,
  Error,
  Message,
} from "../common/common.js"

const ViewDebug = ({ clearAddress }) => {
  return (
    <>
      <Text style={{marginTop: "2rem"}}>🛠️ DEBUG:</Text>
      <Button onClick={() => clearAddress()}>Clear Address</Button>
    </>
  );
};

const ViewStart = ({ setHasUserStarted, clearAddress, debug }) => {
  return (
    <Centered>
      <Message>Please connect and unlock your Ledger device and open the Flow app.</Message>
      <Button onClick={() => setHasUserStarted()}>Connect</Button>
      {debug && <ViewDebug clearAddress={clearAddress} />}
    </Centered>
  );
};

const ViewGetAddress = ({ setNewAddress, isCreatingAccount, setIsCreatingAccount, setMessage, publicKey }) => {

  const createNewAccount = async () => {
    setIsCreatingAccount(true);
    setMessage("Please wait a few moments. The account creation request is being processed.")
    const address = await createAccount(publicKey);
    setNewAddress(address);
  };

  return (
    <Centered>
      { !isCreatingAccount && <Message>The public key on this device is not yet paired with a Flow account. Click the button below to create a new Flow account for this public key.</Message> }
      { !isCreatingAccount && <Button onClick={() => createNewAccount()}>Create New Account</Button> }
    </Centered>
  );
};

const LedgerDevice = ({ account, onGetAccount, handleCancel, debug }) => {
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [initialConnectingToLedger, setInitialConnectingToLedger] = useState(false)
  const [address, setAddress] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const setNewAddress = async (address, publicKey) => {
    try {
      setMessage("Please verify the new address on your device.")
      await setAddressOnDevice(address);
      setMessage(null);
    } catch (e) {
      setIsCreatingAccount(false);
      handleCancel();
    }

    setAddress(address);
    onGetAccount({ address, publicKey });
  };

  useEffect(() => {
    if (account === null && address !== null) {
      setHasUserStarted(false)
      setInitialConnectingToLedger(false)
      setAddress(null)
      setPublicKey(null)
      setMessage(null)
      setIsCreatingAccount(null)
    }
  }, [account])

  useEffect(() => {
    (async function getAccountFromDevice() {
        if (account) return;
        if (!hasUserStarted) return;
        if (address || publicKey) return;
        
        setInitialConnectingToLedger(true)

        try {
          let appVersion = await getVersionOnDevice();

          if (!(semver.gte(appVersion, process.env.REACT_APP_FLOW_APP_VERSION))) {
            setHasUserStarted(false)
            setInitialConnectingToLedger(false)
            setError(VERSION_ERROR_MESSAGE)
            return
          }
 
          if (error === CONNECTION_ERROR_MESSAGE) {
            setError(null);
          }
        } catch(e) {
          console.error(e)
          setHasUserStarted(false)
          setInitialConnectingToLedger(false)
          setError(CONNECTION_ERROR_MESSAGE)
          return
        }
        
        setInitialConnectingToLedger(false)

        let existingAddress;
        let existingPublicKey;
        try {
          let { address, publicKey } = await getAddressAndPublicKeyOnDevice();
          existingAddress = address;
          existingPublicKey = publicKey;

          if (error === CONNECTION_ERROR_MESSAGE) {
            setError(null);
          }
        } catch(e) {
          console.error(e)
          setHasUserStarted(false)
          setError(CONNECTION_ERROR_MESSAGE)
          return
        }

        let addressFromHardwareAPI = await getAccount(existingPublicKey);
      
        if (existingAddress && addressFromHardwareAPI && existingAddress !== addressFromHardwareAPI) {
          try {
            setMessage("Change in public key detected. Verify the corresponding address on your device.")
            await setAddressOnDevice(addressFromHardwareAPI);
            existingAddress = addressFromHardwareAPI
            setMessage(null)
          } catch (e) {
            handleCancel()
          }
        }
  
        if (existingAddress && existingAddress === addressFromHardwareAPI) {
          onGetAccount({ address: existingAddress, publicKey: existingPublicKey });
          setAddress(existingAddress);
        }

        if (!existingAddress && addressFromHardwareAPI) {
          onGetAccount({ address: addressFromHardwareAPI, publicKey: existingPublicKey });
          setAddress(addressFromHardwareAPI);
        }

        setPublicKey(existingPublicKey);

    })();
  }, [hasUserStarted, address, publicKey, account, onGetAccount]);

  return (
    <Column>
      <Centered>
        <Row><LedgerImage src={FlowLogo} /><LedgerTitle>Ledger</LedgerTitle></Row>
        <Text>{address && `Address: ${fcl.withPrefix(address)}`}</Text>
      </Centered>
      <Centered>
        {
          !hasUserStarted && 
            <ViewStart 
              setHasUserStarted={() => setHasUserStarted(true)} 
              clearAddress={() => clearAddressOnDevice()}
              debug={debug} />
        }
        {
          hasUserStarted && publicKey && !address && 
            <ViewGetAddress isCreatingAccount={isCreatingAccount} setIsCreatingAccount={setIsCreatingAccount} setNewAddress={(address) => setNewAddress(address, publicKey)} setMessage={setMessage} publicKey={publicKey} />
        }
        {
          hasUserStarted && !initialConnectingToLedger && !address && !publicKey &&
            <Text>Retrieving Your Flow Account</Text>
        }
        {
          hasUserStarted && initialConnectingToLedger && !address && CONNECTING_MESSAGE
        }
        { error && <Error>{error}</Error> }
        { message && <Text>{message}</Text> }
      </Centered>
    </Column>
  );
};

export default LedgerDevice;
