import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import FlowApp from "@onflow/ledger";
import * as fcl from "@onflow/fcl";
import { log } from "../common/logger";

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
    log(`Trying to connect via WebHID...`);
    try {
        transport = await TransportWebHID.create();
    } catch (e) {
        log(e);
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
        log("Sending Request..");
        const response = await app.getVersion();
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        log("Response received!");
        log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        log(`Device Locked: ${response.deviceLocked}`);
        log(`Test mode: ${response.testMode}`);
        log("Full response:");
        log(response);
        
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
        log("Sending Request..");
        const response = await app.appInfo();
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        log("Response received!");
        log(response);
    } finally {
        if (transport) transport.close();
    }
};

export const getPublicKey = async (path, cryptoOptions = 0x0201) => {
    log("LEDGER.getPublicKey")

    const transport = await getTransport();
    if (!transport) return;

    let publicKey;

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        log(`Device Locked: ${response.deviceLocked}`);
        log(`Test mode: ${response.testMode}`);

        log("Sending Request..");
        log("Please click in the device");
        response = await app.getAddressAndPubKey(path, cryptoOptions);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        log("Response received! (getAddressAndPubKey)");
        log("Full response:");
        log(response);

        publicKey = response.publicKey;
    } catch(e) {
        console.error(`getPublicKey ERROR: ${e} cryptoOptions=${cryptoOptions}`)
    } finally {
        if (transport) transport.close();
    }

    const rawPublicKey = convertToRawPublicKey(publicKey);

    return rawPublicKey
};

export const getAddress = async () => {
    log("LEDGER.getAddress")

    const transport = await getTransport();

    let address;
    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        log(`Device Locked: ${response.deviceLocked}`);
        log(`Test mode: ${response.testMode}`);

        response = await app.getSlot(SLOT);

        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            log(`Error [${response.returnCode}] ${response.errorMessage}`);
            throw new Error();
            return;
        }

        address = response?.account

        log("Response received!");
        log("Full response:");
        log(response);
    } finally {
        if (transport) transport.close();
    }

    return address
}

export const setAddress = async (address, path = LEGACY_PATH_ADDRESS, cryptoOptions = 0x0201) => {    
    log("LEDGER.setAddress")

    const transport = await getTransport();

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        log(`Device Locked: ${response.deviceLocked}`);
        log(`Test mode: ${response.testMode}`);

        response = await app.setSlot(SLOT, fcl.sansPrefix(address), path, cryptoOptions);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            log(`Error [${response.returnCode}] ${response.errorMessage}`);
            throw new Error();
            return;
        }

        log("Response received!");
        log("Full response:");
        log(response);
    } finally {
        if (transport) transport.close();
    }
};

export const clearAddress = async () => {
    log("LEDGER.clearAddress")

    const transport = await getTransport();

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        log(`Device Locked: ${response.deviceLocked}`);
        log(`Test mode: ${response.testMode}`);

        response = await await app.setSlot(SLOT, "0000000000000000", PATH_CLEAR, 0x0201);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        log("Response received!");
        log("Full response:");
        log(response);
    } finally {
        if (transport) transport.close();
    }
};

export const showAddressAndPubKey = async (path = LEGACY_PATH_ADDRESS, cryptoOptions = 0x0201) => {
    log("LEDGER.showAddress")

    const transport = await getTransport();
    
    try {
        const app = new FlowApp(transport);

        let response = await app.showAddressAndPubKey(path, cryptoOptions);
        log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        log(`Device Locked: ${response.deviceLocked}`);
        log(`Test mode: ${response.testMode}`);

        log("Response received!");
        log("Full response:");
        log(response);
    } finally {
        if (transport) transport.close();
    }
}

export const signTransaction = async (tx, path = LEGACY_PATH_ADDRESS, cryptoOptions = 0x0201) => {
    log("LEDGER.signTransaction")

    const transport = await getTransport();
    if (!transport) return;

    let signature;

    try {
        const app = new FlowApp(transport);

        let version = await app.getVersion();
        log(`App Version ${version.major}.${version.minor}.${version.patch}`);
        log(`Device Locked: ${version.deviceLocked}`);
        log(`Test mode: ${version.testMode}`);

        const message = Buffer.from(tx, "hex");
        log("Sending Request..");
        const response = await app.sign(path, message, cryptoOptions);
        log('Sign response: ', response);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.error(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        log("Response received!");
        log("Full response:");
        log(response);

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
