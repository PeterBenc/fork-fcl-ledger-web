import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import FlowApp from "@zondax/ledger-flow";

const scheme = 0x301;
const EXAMPLE_PATH = `m/44'/1'/${scheme}/0/0`;

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
        transport.close();
    }
}

const log = (l) => console.log(l)

export const appInfo = async () => {
    const transport = await getTransport();
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
        transport.close();
    }
}

export const getAddressAndPublicKey = async () => {
    const transport = await getTransport();
    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        console.log("Sending Request..");
        response = await app.getAddressAndPubKey(EXAMPLE_PATH);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }
        return response;
    } finally {
        transport.close();
    }
}

export const getPublicKey = async () => {
    const transport = await getTransport();

    let publicKey;

    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        // now it is possible to access all commands in the app
        console.log("Sending Request..");
        console.log("Please click in the device");
        response = await app.showAddressAndPubKey(EXAMPLE_PATH);
        if (response.returnCode !== FlowApp.ErrorCode.NoError) {
            console.log(`Error [${response.returnCode}] ${response.errorMessage}`);
            return;
        }

        console.log("Response received!");
        console.log("Full response:");
        console.log(response);

        publicKey = response.publicKey;
    } finally {
        transport.close();
    }

    return convertToRawPublicKey(publicKey);
}

export const signTransaction = async (tx) => {
    const transport = await getTransport();
    try {
        const app = new FlowApp(transport);

        let response = await app.getVersion();
        console.log(`App Version ${response.major}.${response.minor}.${response.patch}`);
        console.log(`Device Locked: ${response.deviceLocked}`);
        console.log(`Test mode: ${response.testMode}`);

        const message = Buffer.from(tx, "hex");
        console.log("Sending Request..");
        response = await app.sign(EXAMPLE_PATH, message);

        console.log("Response received!");
        console.log("Full response:");
        console.log(response);
    } finally {
        transport.close();
    }
}

const convertToRawPublicKey = (publicKey) => publicKey.slice(1).toString('hex');