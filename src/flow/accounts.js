const hardwareWalletAPIAddress = 'http://localhost:8081';
const accountsPath = '/accounts'

const signatureAlgorithm = 'ECDSA_P256';
const hashAlgorithm = 'SHA3_256';

const createAccount = async (publicKey) => {

  const data = {  publicKey, signatureAlgorithm, hashAlgorithm };
  const url = `${hardwareWalletAPIAddress}${accountsPath}`;

  const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .catch((error) => {
      console.error('Error:', error);
    });

  return response.address;
};

const getAccount = async (publicKey) => {

  const params = new URLSearchParams({ publicKey });
  const url = `${hardwareWalletAPIAddress}${accountsPath}?${params}`;

  const response = await fetch(url)
    .then(response => {
      if (response.status === 404) {
        return {};
      }

      return response.json();
    })
    .catch((error) => {
      console.error('Error:', error);
    });

  return response.address;
}

export const getOrCreateAccount = async (publicKey) => {
  const existingAddress = await getAccount(publicKey);

  if (existingAddress) {
    return existingAddress;
  }

  return await createAccount(publicKey);
};
