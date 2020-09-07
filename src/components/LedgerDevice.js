import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import LedgerNanoS from "../images/ledger-nano-s.svg";
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

const LedgerImage = styled.img`
  height: 4rem;
`;

const Text = styled.div`
  height: 3rem;
  line-height: 3rem;
`;

const Message = styled.div`
  margin-bottom: 2rem;
`;

const ViewStart = ({ setHasUserStarted, clearAddress }) => {
  return (
    <Centered>
      <Message>Please unlock your Ledger device and open the Flow app.</Message>
      <Button onClick={() => setHasUserStarted()}>Connect</Button>
      <Text style={{marginTop: "2rem"}}>🛠️ DEBUG STUFF:</Text>
      <Button onClick={() => clearAddress()}>Clear Address</Button>
    </Centered>
  );
};

const ViewGetAddress = ({ setAddress, publicKey }) => {

  const createNewAccount = async () => {
    const address = await createAccount(publicKey);
    setAddress(address);
  };

  return (
    <Centered>
      <Message>Please choose an option to initialize Flow on your Ledger device.</Message>
      <Button onClick={() => createNewAccount()}>Create New Account</Button>
      <Text>OR</Text>
      <Button>Enter Existing Address</Button>
    </Centered>
  );
};

const LedgerDevice = ({ account, onGetAccount }) => {
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [address, setAddress] = useState(null);
  const [publicKey, setPublicKey] = useState(null);

  const setNewAddress = async (address, publicKey) => {
    await setAddressOnDevice(address);
    onGetAccount({ address, publicKey });
    setAddress(address);
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
          return
        }
      
        if (!existingAddress) {
          existingAddress = await getAccount(existingPublicKey);
          if (existingAddress) {
            await setAddressOnDevice(existingAddress);
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
        <LedgerImage src={LedgerNanoS} />
        <Text>{address && `Address: ${address}`}</Text>
      </Centered>
      <Centered>
        {
          !hasUserStarted && 
            <ViewStart setHasUserStarted={() => setHasUserStarted(true)} clearAddress={() => clearAddressOnDevice()} />
        }
        {
          hasUserStarted && publicKey && !address && 
            <ViewGetAddress setAddress={(address) => setNewAddress(address, publicKey)} publicKey={publicKey} />
        }
      </Centered>
    </div>
  );
};

export default LedgerDevice;