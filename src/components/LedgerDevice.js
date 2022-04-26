import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import { log } from "../common/logger"
import semver from "semver"
import FlowLogo from "../images/logo.svg"
import Logomark from "../images/logomark.svg"
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
  OutlineButton,
  Balance,
  AccountList,
  AccountItem,
  AccountItemAddress,
  AccountItemBalance,
  Currency,
  HorizontalSpacer,
  Column,
  Centered,
  Row,
  LedgerTitle,
  LedgerImage,
  Text,
  Error,
  Message,
  LogoSpinner,
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

const ViewAddressSelector = ({
  accountsAndPublicKeys,
  setSelectedAccount,
  setIsCreatingAccount,
  setAddressOnDevice,
  setMessage,
  setAccountsAndPublicKeys,
  isCreatingAccount,
  network
}) => {

  const createNewAccount = async () => {
    setIsCreatingAccount(true);
    setMessage("Please wait a few moments. The account creation request is being processed.")

    const nextAvailablePath = await getNextAvailableAccountPath(accountsAndPublicKeys, network)
    const nextAvailablePublicKey = await getPublicKeyOnDevice(nextAvailablePath, 0x0201)

    const address = await createAccount(nextAvailablePublicKey)

    setAccountsAndPublicKeys(null)
    setMessage(null)
    setIsCreatingAccount(false)
  };

  return (
    <Centered>
      <AccountList>
        { !isCreatingAccount && accountsAndPublicKeys && accountsAndPublicKeys.map(acct => (
          <AccountItem onClick={() => setSelectedAccount(acct)} key={acct.address}>
            <AccountItemAddress>{fcl.withPrefix(acct.address)}</AccountItemAddress>
            <AccountItemBalance>{acct.balance / 10**8}<Currency>FLOW</Currency></AccountItemBalance>
          </AccountItem>
        ))}
      </AccountList>
      { !isCreatingAccount && accountsAndPublicKeys && accountsAndPublicKeys.length > 0 && <HorizontalSpacer />}
      { !isCreatingAccount && <Button onClick={createNewAccount}>Create New Account</Button> }
    </Centered>
  );
}

const LedgerDevice = ({
  account,
  authnAddress = null,
  network,
  onGetAccount,
  handleCancel,
  debug
}) => {
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
        if (isCreatingAccount) return;
        
        setInitialConnectingToLedger(true)

        try {
          let appVersion = await getVersionOnDevice()

          log("appVersion", appVersion)

          if (!(semver.gte(appVersion, process.env.REACT_APP_FLOW_APP_VERSION))) {
            setHasUserStarted(false)
            setInitialConnectingToLedger(false)
            setError(VERSION_ERROR_MESSAGE)
            return
          }
 
          if (error === CONNECTION_ERROR_MESSAGE) {
            setError(null)
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
        } catch(e) {}

        let foundAccountsAndPublicKeys;
        if (!accountsAndPublicKeys) {
          try {
            foundAccountsAndPublicKeys = await getAllAddressAndPublicKeysByPaths(network);

            if (error === CONNECTION_ERROR_MESSAGE) {
              setError(null);
            }

            if (foundAccountsAndPublicKeys) setAccountsAndPublicKeys(foundAccountsAndPublicKeys)
          } catch(e) {
            console.error(e)
            setHasUserStarted(false)
            setError(CONNECTION_ERROR_MESSAGE)
            return
          }
        }

        if (!selectedAccount && !authnAddress) {
          return
        }

        if (!selectedAccount && authnAddress) {
          let foundAccount = foundAccountsAndPublicKeys.find(acct => fcl.withPrefix(acct.address) === fcl.withPrefix(authnAddress))
          setSelectedAccount(foundAccount)
          return;
        }

        let selectedAccountAddressFromHardwareAPI = await getAccount(selectedAccount.publicKey);

        // console.log(
        //   "existingAddressOnDevice=", existingAddressOnDevice,
        //   " selectedAccountAddressFromHardwareAPI=", selectedAccountAddressFromHardwareAPI,
        //   " existingAddressOnDevice=", existingAddressOnDevice,
        // )

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
          onGetAccount({
            address: existingAddressOnDevice,
            publicKey: selectedAccount.publicKey,
            path: selectedAccount.path,
          })
          setAddress(existingAddressOnDevice)
        }

        if (!existingAddressOnDevice && selectedAccountAddressFromHardwareAPI) {
          try {
            setMessage("Change in stored address detected. Verify the corresponding address on your device.")
            await setAddressOnDevice(selectedAccountAddressFromHardwareAPI, selectedAccount.path);
            setMessage(null)
          } catch (e) {
            handleCancel()
          }

          onGetAccount({ 
            address: selectedAccountAddressFromHardwareAPI,
            publicKey: selectedAccount.publicKey,
            path: selectedAccount.path,
          })
          setAddress(selectedAccountAddressFromHardwareAPI)
        }

    })();
  }, [hasUserStarted, address, publicKey, account, onGetAccount, selectedAccount, isCreatingAccount])

  return (
    <Column>
      <Centered style={{ height: "4rem" }}>
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
          hasUserStarted && accountsAndPublicKeys && !isCreatingAccount && !selectedAccount && 
            <Text>Please select an account to login.</Text>
        }

        {
          hasUserStarted && accountsAndPublicKeys && !selectedAccount && 
            <ViewAddressSelector 
              accountsAndPublicKeys={accountsAndPublicKeys}
              isCreatingAccount={isCreatingAccount}
              setIsCreatingAccount={setIsCreatingAccount}
              setSelectedAccount={setSelectedAccount}s
              setAddressOnDevice={setNewAddress}
              setAccountsAndPublicKeys={setAccountsAndPublicKeys}
              setMessage={setMessage} 
              network={network}
            />
        }

        {
          hasUserStarted && !initialConnectingToLedger && !accountsAndPublicKeys &&
            <>
              <Text>Discovering your Flow accounts.<br/>This may take some time.</Text>
              <LogoSpinner src={Logomark} />
            </>
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
