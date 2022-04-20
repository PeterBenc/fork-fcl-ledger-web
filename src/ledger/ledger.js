import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import FlowApp from "@onflow/ledger";
import * as fcl from "@onflow/fcl";

const SCHEME = 0x301;
export const LEGACY_PATH_ADDRESS = `m/44'/1'/${SCHEME}/0/0`;
const PATH_CLEAR = "m/0/0/0/0/0 ";
const SLOT = 0;

const errorCodeEmptyBuffer = 0x6982;
export const getPath = (accountIndex, keyIndex, network) => {
    return `m/44'/${network === "mainnet" ? "539'" : "1'"}/${accountIndex}'/0/${keyIndex}`
} 

const getTransport = async () => {
    let transport = null;
    console.log(`Trying to connect via WebHID...`);
    try {
        transport = await TransportWebHID.create();
    } catch (e) {
        console.log(e);
    }
    return transport;
};

export const getVersion = async () => {
    const transport = await getTransport();

    let major;
    let minor;
    let patch;
    try {
        const app = new FlowApp(transport);

        // now it is possible to access all commands in the app
        console.log("Sending Request..");
        const response = await app.getVersion();
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received!");
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);
        console.log("Full response:");
        console.log(response);
        
        major = response.major
        minor = response.minor
        patch = response.patch
    } finally {
        if (transport) await transport.close();
    }

    return `${major}.${minor}.${patch}`
};

export const appInfo = async () => {
    const transport = await getTransport();
    if (!transport) return;
    try {
        const app = new FlowApp(transport);

        // now it is possible to access all commands in the app
        console.log("Sending Request..");
        const response = await app.appInfo();
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received!");
        console.log(response);
    } finally {
        if (transport) transport.close();
    }
};

export const getPublicKey = async (path, sign_algo = 0x02, hash_algo = 0x01) => {
    console.log("LEDGER.getPublicKey")

    const transport = await getTransport();
    if (!transport) return;

    let publicKey;

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        // response = await app.getSlot(SLOT);
        // if (response.returnCode === FlowApp.ErrorCode.NoError) {
        //     address = response.account;
        // } else if (response.returnCode === errorCodeEmptyBuffer) {
        //     address = null;
        // } else {
        //     console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
        //     return;
        // }

        // console.log("Response received! (getSlot)");
        // console.log("Full response:");
        // console.log(response);

        // { 
        //     sign_algo, 
        //     derivation_path = m / purpose' / coin_type' / account' / change / address_index,
        //     hash_algo,
        // }

        console.log("Sending Request..");
        console.log("Please click in the device");
        response = await app.getAddressAndPubKey(path, sign_algo, hash_algo);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received! (getAddressAndPubKey)");
        console.log("Full response:");
        console.log(response);

        publicKey = response.publicKey;
    } catch(e) {
        console.error(`getPublicKey ERROR: ${e} path=${path} sign_algo=${sign_algo}, hash_algo=${hash_algo}`)
    } finally {
        if (transport) transport.close();
    }

    const rawPublicKey = convertToRawPublicKey(publicKey);

    return rawPublicKey
};

export const getAddress = async () => {
    console.log("LEDGER.getAddress")

    const transport = await getTransport();

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        response = await await app.getSlot(SLOT, LEGACY_PATH_ADDRESS);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            throw new Error();
            return;
        }

        console.log("Response received!");
        console.log("Full response:");
        console.log(response);
    } finally {
        if (transport) transport.close();
    }
}

export const setAddress = async (address, path = LEGACY_PATH_ADDRESS, sign_algo = 0x02, hash_algo = 0x01) => {    
    console.log("LEDGER.setAddress")

    const transport = await getTransport();

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        response = await app.setSlot(SLOT, fcl.sansPrefix(address), path, sign_algo, hash_algo);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            throw new Error();
            return;
        }

        console.log("Response received!");
        console.log("Full response:");
        console.log(response);
    } finally {
        if (transport) transport.close();
    }
};

export const clearAddress = async () => {
    console.log("LEDGER.clearAddress")

    const transport = await getTransport();

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        response = await await app.setSlot(SLOT, "0000000000000000", PATH_CLEAR);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received!");
        console.log("Full response:");
        console.log(response);
    } finally {
        if (transport) transport.close();
    }
};

export const showAddressAndPubKey = async (path = LEGACY_PATH_ADDRESS, sign_algo = 0x03, hash_algo = 0x01) => {
    console.log("LEDGER.showAddress")

    const transport = await getTransport();
    
    try {
        const app = new FlowApp(transport);

        let response = await app.showAddressAndPubKey(path, sign_algo, hash_algo);
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        console.log("Response received!");
        console.log("Full response:");
        console.log(response);
    } finally {
        if (transport) transport.close();
    }
}

export const signTransaction = async (tx, path = LEGACY_PATH_ADDRESS, sign_algo = 0x03, hash_algo = 0x01) => {
    console.log("LEDGER.signTransaction")

    const transport = await getTransport();
    if (!transport) return;

    let signature;

    try {
        const app = new FlowApp(transport);

        let version = await app.getVersion();
        console.log(`App Version ${version.major}.${version.minor}.${version.patch}`);
        console.log(`Device Locked: ${version.deviceLocked}`);
        console.log(`Test mode: ${version.testMode}`);

        const message = Buffer.from(tx, "hex");
        console.log("Sending Request..");
        const response = await app.sign(path, message, sign_algo, hash_algo);
        console.log('Sign response: ', response);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.error(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received!");
        console.log("Full response:");
        console.log(response);

        signature = response.signatureCompact;
    } finally {
        if (transport) transport.close();
    }

    return convertToRawSignature(signature);
};

// remove leading byte from public key
const convertToRawPublicKey = (publicKey) => publicKey.slice(1).toString("hex");

// remove 65th byte from signature
const convertToRawSignature = (signature) => signature.slice(0, -1).toString("hex");
