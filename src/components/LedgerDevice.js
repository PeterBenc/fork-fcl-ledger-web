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

const Button = styled.button`
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem 1rem 2rem;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
  background-color: #02D87E;
  color: white;
`;

const Column = styled.div`
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

const Centered = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const LedgerTitle = styled.div`
  margin-left: 0.5rem;
  transform: translateY(4px);
  font-weight: 400;
  font-size: 2rem;
  text-decoration: none;
  color: #2a2825;
`

const LedgerImage = styled.img`
  height: 4rem;
`;

const Text = styled.div`
  margin-top: 1rem;
  min-height: 3rem;
  text-align: center;
`;

const Error = styled.div`
  margin-top: 1rem;
  min-height: 3rem;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: left;
  color: white;
  background-color: #FC4C2E;
  box-sizing: border-box;
`;

const Message = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const TextCenter = styled.div`
  text-align: center;
`

const HorizontalLine = styled.hr`
  color: white;
  border: 1px solid white;
`

const CONNECTION_ERROR_MESSAGE = 
<div>
  <TextCenter>Sorry, we couldn't connect to your Ledger. Please ensure that your Ledger is connected and the Flow app is open.</TextCenter><br />
  <HorizontalLine /><br />
  We recommend using Google Chrome to connect to your Ledger. If using Chrome on a Windows device, the common solution to Ledger connection issues is to:<br /><br />
  - Close any other software that can interact with your Ledger Device (Ledger Live, other wallets etc)<br />
  - Navigate to chrome://flags#new-usb-backend<br />
  - Ensure that the Enable new USB backend flag is set to “Disabled”<br />
  - Restart your browser and reconnect your Ledger device
</div>

const VERSION_ERROR_MESSAGE = "Your Flow app is out of date. Please update your Flow app to the latest version using Ledger Live."

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
          hasUserStarted && initialConnectingToLedger && !address && 
            <Text>Attempting to connect to your Ledger device.<br/><br/>Please connect and unlock your Ledger device and open the Flow app.</Text>
        }
        { error && <Error>{error}</Error> }
        { message && <Text>{message}</Text> }
      </Centered>
    </Column>
  );
};

export default LedgerDevice;
