import React from "react"
import {
    TextCenter,
    HorizontalLine,
    Text
} from "./common.js"

export const INITIAL_PK_MESSAGE = "Press the button below to make your Ledger device display the Public Key it maintains."
export const VIEW_PK_MESSAGE = "View the Public Key displayed on your Ledger device."
export const CONNECTING_MESSAGE = <Text>Attempting to connect to your Ledger device.<br/><br/>Please connect and unlock your Ledger device and open the Flow app.</Text>
export const CONNECTION_ERROR_MESSAGE = 
<div>
  <TextCenter>Sorry, we couldn't connect to your Ledger. Please ensure that your Ledger is connected and the Flow app is open.</TextCenter><br />
  <HorizontalLine /><br />
  We recommend using Google Chrome to connect to your Ledger. The common solution to Ledger connection issues is to:<br /><br />
  - Close any other software that can interact with your Ledger Device (Ledger Live, other wallets etc)<br />
  - Navigate to chrome://flags#new-usb-backend<br />
  - Ensure that the Enable new USB backend flag is set to “Disabled”<br />
  - Restart your browser and reconnect your Ledger device
</div>
export const VERSION_ERROR_MESSAGE = "Your Flow app is out of date. Please update your Flow app to the latest version using Ledger Live."
