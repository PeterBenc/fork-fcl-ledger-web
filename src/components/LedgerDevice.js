import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import * as fcl from "@onflow/fcl"
import FlowLogo from "../images/logo.svg";
import {getAccount, createAccount} from "../flow/accounts";
import {
  getAddressAndPublicKey as getAddressAndPublicKeyOnDevice, 
  setAddress as setAddressOnDevice,
  clearAddress as clearAddressOnDevice,
} from "../ledger/ledger.js";

const Button = styled.button`
  -webkit-appearance: none;
  -moz-appearance: none;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem 1rem 2rem;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
`;

const Centered = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
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
  min-height: 3rem;
  text-align: center;
`;

const Message = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

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
      { !isCreatingAccount && <Message>Please choose an option to initialize Flow on your Ledger device.</Message> }
      { !isCreatingAccount && <Button onClick={() => createNewAccount()}>Create New Account</Button> }
    </Centered>
  );
};

const LedgerDevice = ({ account, onGetAccount, handleCancel, debug }) => {
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [address, setAddress] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [message, setMessage] = useState(null);
  const [isCreatingAccount, setIsCreatingAccount] = useStatus(false);

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

        let existingAddress;
        let existingPublicKey;
        try {
          let { address, publicKey } = await getAddressAndPublicKeyOnDevice();
          existingAddress = address;
          existingPublicKey = publicKey;

        } catch(e) {
          setHasUserStarted(false)
          setMessage("Sorry, we couldn't connect to your Ledger. Please ensure that your Ledger is connected and the Flow app is open.")
          return
        }
      
        if (!existingAddress) {
          existingAddress = await getAccount(existingPublicKey);
          if (existingAddress) {
            try {
              setMessage("Please verify the new address on your device.")
              await setAddressOnDevice(existingAddress);
              setMessage(null)
            } catch (e) {
              handleCancel()
            }
          }
        }
  
        if (existingAddress) {
          onGetAccount({ address: existingAddress, publicKey: existingPublicKey });
          setAddress(existingAddress);
        }

        setPublicKey(existingPublicKey);

    })();
  }, [hasUserStarted, address, publicKey, account, onGetAccount]);

  return (
    <div>
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
          hasUserStarted && !(publicKey && !address) && 
            <Text>Retrieving Your Flow Account</Text>
        }
        { message && <Text>{message}</Text> }
      </Centered>
    </div>
  );
};

export default LedgerDevice;