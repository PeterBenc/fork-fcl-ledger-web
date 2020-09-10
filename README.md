# FCL/Ledger Web Wallet Proxy App

## Developing locally

### Install

```shell script
yarn install
```

### Start the Hardware Wallet API

From the [Hardware Wallet API repository](https://github.com/onflow/flow-hardware-wallet-api), run this command to start both the wallet API and the Flow Emulator:

```shell script
make run
```

### Start the app

```shell script
yarn run start
```

## Building & publishing

```shell script
# build the React app
yarn run build-staging

# build the Docker image
docker build -t gcr.io/dl-flow/fcl-ledger-web-staging .

# publish the Docker image
docker push gcr.io/dl-flow/fcl-ledger-web-staging
```
