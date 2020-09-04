import * as fcl from "@onflow/fcl"

const hardwareWalletAPIAddress = "http://localhost:8081";
const accountsPath = "/accounts"

const signatureAlgorithm = "ECDSA_P256";
const hashAlgorithm = "SHA2_256";

export const createAccount = async (publicKey) => {

  const data = { publicKey, signatureAlgorithm, hashAlgorithm };
  const url = `${hardwareWalletAPIAddress}${accountsPath}`;

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
  const url = `${hardwareWalletAPIAddress}${accountsPath}?${params}`;

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

  const key = account.keys.find(k => k.publicKey === publicKey)

  if (!key) return -1;

  return key.index
};