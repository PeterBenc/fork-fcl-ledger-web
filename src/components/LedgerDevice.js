import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import semver from "semver"
import FlowLogo from "../images/logo.svg"
import {getAccount, createAccount} from "../flow/accounts"
import {
  getVersion as getVersionOnDevice,
  getAddressAndPublicKeys as getAddressAndPublicKeysOnDevice, 
  setAddress as setAddressOnDevice,
  clearAddress as clearAddressOnDevice,
  getAddress as getAddressOnDevice,
  getPublicKey as getPublicKeyOnDevice,
} from "../ledger/ledger.js"
import {
  getAllAddressAndPublicKeysByPaths,
  getNextAvailableAccountPath
} from "../flow/accounts.js"
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

const ViewAddressSelector = ({ accountsAndPublicKeys, setSelectedAccount, setIsCreatingAccount, setAddressOnDevice, setMessage, isCreatingAccount }) => {

  const createNewAccount = async () => {
    setIsCreatingAccount(true);
    setMessage("Please wait a few moments. The account creation request is being processed.")

    const nextAvailablePath = getNextAvailableAccountPath(accountsAndPublicKeys)
    const nextAvailablePublicKey = getPublicKeyOnDevice(nextAvailablePath)

    const address = await createAccount(nextAvailablePublicKey)

    setAddressOnDevice(address, nextAvailablePublicKey, nextAvailablePath)
  };

  return (
    <Centered>
      {/* { !isCreatingAccount && <Message>The public key on this device is not yet paired with a Flow account. Click the button below to create a new Flow account for this public key.</Message> } */}
      { !isCreatingAccount && accountsAndPublicKeys && accountsAndPublicKeys.map(acct =>
         <Button onClick={() => setSelectedAccount(acct)}>{acct.address}</Button>
      )}
      { !isCreatingAccount && <Button onClick={createNewAccount}>Create New Account</Button> }
    </Centered>
  );
}

// const ViewGetAddress = ({ setNewAddress, isCreatingAccount, setIsCreatingAccount, setMessage, publicKey }) => {

//   const createNewAccount = async () => {
//     setIsCreatingAccount(true);
//     setMessage("Please wait a few moments. The account creation request is being processed.")
//     const address = await createAccount(publicKey);
//     setNewAddress(address);
//   };

//   return (
//     <Centered>
//       { !isCreatingAccount && <Message>The public key on this device is not yet paired with a Flow account. Click the button below to create a new Flow account for this public key.</Message> }
//       { !isCreatingAccount && <Button onClick={() => createNewAccount()}>Create New Account</Button> }
//     </Centered>
//   );
// };

const LedgerDevice = ({ account, onGetAccount, handleCancel, debug }) => {
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [initialConnectingToLedger, setInitialConnectingToLedger] = useState(false)

  const [address, setAddress] = useState(null);
  const [publicKey, setPublicKey] = useState(null);

  const [accountsAndPublicKeys, setAccountsAndPublicKeys] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const setNewAddress = async (address, publicKey, path) => {
    try {
      setMessage("Please verify the new address on your device.")
      await setAddressOnDevice(address, path);
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
        // if (address || publicKey) return;
        
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

        let existingAddressOnDevice
        try {
          existingAddressOnDevice = await getAddressOnDevice()
        } catch(e) {
          // console.error(e)
          // setHasUserStarted(false)
          // setInitialConnectingToLedger(false)
          // setError(CONNECTION_ERROR_MESSAGE)
          // return
        }

        try {
          let accountsAndPublicKeys = await getAllAddressAndPublicKeysByPaths();

          if (error === CONNECTION_ERROR_MESSAGE) {
            setError(null);
          }

          setAccountsAndPublicKeys(accountsAndPublicKeys)
        } catch(e) {
          console.error(e)
          setHasUserStarted(false)
          setError(CONNECTION_ERROR_MESSAGE)
          return
        }

        if (!selectedAccount) {
          return
        }

        let selectedAccountAddressFromHardwareAPI = await getAccount(selectedAccount.address);
      
        if (
          existingAddressOnDevice &&
          selectedAccountAddressFromHardwareAPI &&
          existingAddressOnDevice !== selectedAccountAddressFromHardwareAPI
        ) {
          try {
            setMessage("Change in public key detected. Verify the corresponding address on your device.")
            await setAddressOnDevice(selectedAccountAddressFromHardwareAPI);
            existingAddressOnDevice = selectedAccountAddressFromHardwareAPI
            setMessage(null)
          } catch (e) {
            handleCancel()
          }
        }
  
        if (existingAddressOnDevice && existingAddressOnDevice === selectedAccountAddressFromHardwareAPI) {
          onGetAccount({ address: existingAddressOnDevice, publicKey: selectedAccountAddressFromHardwareAPI });
          setAddress(existingAddressOnDevice);
        }

        if (!existingAddressOnDevice && selectedAccountAddressFromHardwareAPI) {
          onGetAccount({ address: selectedAccountAddressFromHardwareAPI, publicKey: selectedAccount.publicKey });
          setAddress(selectedAccountAddressFromHardwareAPI);
        }

        // setPublicKey(existingPublicKey);

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

        {/* {
          hasUserStarted && publicKey && !address && 
            <ViewGetAddress isCreatingAccount={isCreatingAccount} setIsCreatingAccount={setIsCreatingAccount} setNewAddress={(address) => setNewAddress(address, publicKey, path)} setMessage={setMessage} publicKey={publicKey} />
        } */}

        {
          hasUserStarted && accountsAndPublicKeys && !selectedAccount && 
            <ViewAddressSelector 
              isCreatingAccount={isCreatingAccount}
              setIsCreatingAccount={setIsCreatingAccount}
              setAddressOnDevice={setNewAddress}
              setMessage={setMessage} 
            />
        }

        {
          hasUserStarted && !initialConnectingToLedger && !accountsAndPublicKeys &&
            <Text>Retrieving Your Flow Accounts</Text>
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
