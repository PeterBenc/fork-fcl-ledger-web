import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import FlowApp from "@onflow/ledger";

const SCHEME = 0x301;
const PATH_ADDRESS = `m/44'/1'/${SCHEME}/0/0`;
const PATH_CLEAR = "m/0/0/0/0/0 ";
const SLOT = 0;

const errorCodeEmptyBuffer = 0x6982;

const getTransport = async () => {
    let transport = null;
    console.log(`Trying to connect via WebUSB...`);
    try {
        transport = await TransportWebUSB.create();
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

export const getAddressAndPublicKey = async () => {
    console.log("LEDGER.getAddressAndPublicKey")

    const transport = await getTransport();
    if (!transport) return;

    let address;
    let publicKey;

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        response = await app.getSlot(SLOT);
        if (response.returnCode === FlowApp.ErrorCode.NoError) {
            address = response.account;
        } else if (response.returnCode === errorCodeEmptyBuffer) {
            address = null;
        } else {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received! (getSlot)");
        console.log("Full response:");
        console.log(response);

        console.log("Sending Request..");
        console.log("Please click in the device");
        response = await app.getAddressAndPubKey(PATH_ADDRESS);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received! (getAddressAndPubKey)");
        console.log("Full response:");
        console.log(response);

        publicKey = response.publicKey;
    } finally {
        if (transport) transport.close();
    }

    const rawPublicKey = convertToRawPublicKey(publicKey);

    return {
        address: address,
        publicKey: rawPublicKey,
    };
};

export const setAddress = async (address) => {    
    console.log("LEDGER.setAddress")

    const transport = await getTransport();

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        response = await await app.setSlot(SLOT, address, PATH_ADDRESS);
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

export const showAddressAndPubKey = async () => {
    console.log("LEDGER.showAddress")

    const transport = await getTransport();
    
    try {
        const app = new FlowApp(transport);

        let response = await app.showAddressAndPubKey(PATH_ADDRESS);
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

export const signTransaction = async (tx) => {
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
        const response = await app.sign(PATH_ADDRESS, message);
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
