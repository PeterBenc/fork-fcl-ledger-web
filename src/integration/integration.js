import {getOrCreateAccount} from "../flow/accounts";
import {
  getAddressAndPublicKey as getAddressAndPublicKeyOnDevice, 
  setAddress as setAddressOnDevice,
} from "../ledger/ledger.js";

export const getAccount = async () => {
  const { address: existingAddress, publicKey } = await getAddressAndPublicKeyOnDevice();
            
  let address;

  if (existingAddress) {
      address = existingAddress;
  } else {
      address = await getOrCreateAccount(publicKey);
      await setAddressOnDevice(address);
  }

  return { address, publicKey };
};
