import * as fcl from "@onflow/fcl"
import { config } from "@onflow/fcl"

import { 
  getPublicKey as getPublicKeyOnDevice,
  getPath,
  LEGACY_PATH_ADDRESS,
} from "../ledger/ledger.js"

const accountsPath = "/accounts"

const signatureAlgorithm = "ECDSA_P256";
const hashAlgorithm = "SHA2_256";

export const createAccount = async (publicKey) => {

  const data = { publicKey, signatureAlgorithm, hashAlgorithm };
  const hardwareWalletAPIHost = await config().get("hardwareWallet.api", "http://localhost:8081")
  const url = `${hardwareWalletAPIHost}${accountsPath}`;

  const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .catch(error => {
      console.error("Error:", error);
    });

  return response ? response.address : null;
};

export const getAccount = async (publicKey) => {

  const params = new URLSearchParams({ publicKey });
  const hardwareWalletAPIHost = await config().get("hardwareWallet.api", "http://localhost:8081")
  const url = `${hardwareWalletAPIHost}${accountsPath}?${params}`;

  const response = await fetch(url)
    .then(response => {
      if (response.status === 404) {
        return {};
      }

      return response.json();
    })
    .catch(error => {
      console.error("Error:", error);
    });

  return response ? response.address : null;
}

export const getKeyIdForKeyByAccountAddress = async (address, publicKey) => {

  const response = await fcl.send([
    fcl.getAccount(fcl.sansPrefix(address))
  ])

  const account = await fcl.decode(response)

  const key = account.keys.find(k => {
    return k.publicKey === publicKey && !k.revoked
  })

  if (!key) return -1;

  return key.index
};

//

export const getNextAvailableAccountPath = async (accounts, network) => {
  accounts = accounts.filter(account => !account.isLegacyAccount)

  let sortedAccountsByAccountIndex = accounts.sort((a, b) => a.accountIndex - b.accountIndex)

  let minUnusedAccountIndex = sortedAccountsByAccountIndex[0] ? sortedAccountsByAccountIndex[0].accountIndex : 0
  sortedAccountsByAccountIndex.forEach(account => {
    if (minUnusedAccountIndex === account.accountIndex) minUnusedAccountIndex = account.accountIndex + 1
  })
  let nextAvailableAccountIndex = minUnusedAccountIndex
  
  let accountsAtNextAvailableAccountIndex = accounts.map(account => account.accountIndex = nextAvailableAccountIndex) 
  let minUnusedKeyIndex = 0
  accountsAtNextAvailableAccountIndex.forEach(account => {
    if (minUnusedKeyIndex === account.keyIndex) minUnusedKeyIndex = account.keyIndex + 1
  })
  let nextAvailableAccountKeyIndex = minUnusedKeyIndex

  return getPath(nextAvailableAccountIndex, nextAvailableAccountKeyIndex, network)
}

export const getNextAvailableAccountKeyPath = async (accounts, accountIndex, network) => {
  accounts = accounts.filter(account => !account.isLegacyAccount)

  let accountsAtAccountIndex = accounts.map(account => account.accountIndex = accountIndex) 
  let minUnusedKeyIndex = 0
  accountsAtAccountIndex.forEach(account => {
    if (minUnusedKeyIndex + 1 === account.keyIndex) minUnusedKeyIndex = account.keyIndex
  })
  let nextAvailableAccountKeyIndex = minUnusedKeyIndex

  return getPath(accountIndex, nextAvailableAccountKeyIndex, network)
}

export const getLegacyAddressAndPublicKey = async (sign_algo = 0x02, hash_algo = 0x01) => {
  return await getAddressAndPublicKeyByPath(LEGACY_PATH_ADDRESS, sign_algo, hash_algo)
}

export const getAddressAndPublicKeyByPath = async (path, sign_algo = 0x02, hash_algo = 0x01) => {
  const publicKey = await getPublicKeyOnDevice(path, sign_algo, hash_algo)
  console.log("getAddressAndPublicKeyByPath path=", path, " publicKey=", publicKey)
  let address = null
  if (publicKey) address = await getAccount(publicKey)

  return {
    address,
    publicKey,
  }
}

export const getAllAddressAndPublicKeysByPaths = async (network) => {
  let legacyAddressPublicKey = null
  try {
    legacyAddressPublicKey = await getLegacyAddressAndPublicKey()
  } catch (e) {
    console.log("getAllAddressAndPublicKeysByPaths: NO lEGACY ACCOUNT", LEGACY_PATH_ADDRESS)
  }

  const MAX_ACCOUNT_GAP = 1
  let currentAccountGap = 0
  const MAX_KEY_GAP = 1
  let currentKeyGap = 0

  let accountIndex = 0
  let keyIndex = 0

  let accounts = {}

  if (legacyAddressPublicKey && legacyAddressPublicKey.address !== null) {
    const acct = await fcl.account(legacyAddressPublicKey.address)

    accounts["legacy"] = [{
      address: legacyAddressPublicKey.address,
      publicKey: legacyAddressPublicKey.publicKey,
      balance: acct.balance,
      accountIndex: null,
      keyIndex: null,
      path: LEGACY_PATH_ADDRESS,
      isLegacyAccount: true,
    }]
  }

  while (currentAccountGap < MAX_ACCOUNT_GAP) {
    const currentPath = getPath(accountIndex, keyIndex, network)

    let currentAddressPublicKey = null
    try {
      currentAddressPublicKey = await getAddressAndPublicKeyByPath(currentPath, 0x02, 0x01)
    } catch (e) {
      console.log("getAddressAndPublicKeyByPath: NO ACCOUNT FOUND path=", currentPath)
    }

    if (currentAddressPublicKey?.address) {
      currentAccountGap = 0
      currentKeyGap = 0

      const acct = await fcl.account(currentAddressPublicKey.address)

      let foundAccount = {
        address: currentAddressPublicKey.address,
        publicKey: currentAddressPublicKey.publicKey,
        balance: acct.balance,
        accountIndex,
        keyIndex,
        path: currentPath,
        isLegacyAccount: false,
      }

      if (accounts[accountIndex]) {
        accounts[accountIndex].push(foundAccount)
      } else {
        accounts[accountIndex] = [foundAccount]
      }

      console.log("accounts", accounts)

      keyIndex = keyIndex + 1

    } else {
      currentKeyGap = currentKeyGap + 1
      keyIndex = keyIndex + 1

      if (currentKeyGap >= MAX_KEY_GAP) {
        if (!(accounts[accountIndex])) {
          currentAccountGap = currentAccountGap + 1
        }
        accountIndex = accountIndex + 1

        keyIndex = 0
        currentKeyGap = 0
      }
    }
  }

  let ret = Object.values(accounts).reduce((acc, curr) => {
    return acc.concat(curr)
  }, [])

  console.log("ACCOUNTS =>>>> ", accounts, ret)

  return ret
}
