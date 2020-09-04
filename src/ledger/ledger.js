import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import FlowApp from "@zondax/ledger-flow";

var bip66 = require('bip66')

const scheme = 0x301;
const EXAMPLE_PATH = `m/44'/1'/${scheme}/0/0`;
const SLOT = 0;

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
    } finally {
        if (transport) transport.close();
    }
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
        } else if (response.returnCode === FlowApp.ErrorCode.EmptyBuffer) {
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
        response = await app.getAddressAndPubKey(EXAMPLE_PATH);
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
    const transport = await getTransport();

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        response = await await app.setSlot(SLOT, address, EXAMPLE_PATH);
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

export const signTransaction = async (tx) => {
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
        const response = await app.sign(EXAMPLE_PATH, message);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }
        
        console.log("Response received!");
        console.log("Full response:");
        console.log(response);

        signature = response.signatureDER;
    } finally {
        if (transport) transport.close();
    }

    return convertToRawSignature(signature);
};

const convertToRawPublicKey = (publicKey) => publicKey.slice(1).toString("hex");
const convertToRawSignature = (derSignature) => {
    const { r, s } = bip66.decode(derSignature);
    return Buffer.concat([r, s]).toString("hex");
};
