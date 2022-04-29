import React from "react"
import styled from "styled-components"
import {showAddressAndPubKey} from "../ledger/ledger.js"

const Column = styled.div`
    display: flex;
    flex-direction: column;
`

export const Test = ({ network = "local" }) => {

    return (
        <Column>
            <button onClick={showAddressAndPubKey}>showAddressAndPubKey</button>
            <button onClick={showAddressAndPubKey}>showAddressAndPubKey</button>
        </Column>
    )
}