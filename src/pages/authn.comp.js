import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {getPublicKey} from "../ledger/ledger.js"
import {getOrCreateAccount} from "../flow/accounts";

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const StyledTitle = styled.div`
    font-size: 2rem;
    text-decoration: underline;
    text-align: center;
`

const StyledSubtitle = styled.div`
    margin-top: 2rem;
    font-size: 1rem;
    text-align: center;
`

export const Authn = () => {
    const [address, setAddress] = useState("");

    useEffect(() => {
        async function getAddress() {
            const publicKey = await getPublicKey();
            const address = await getOrCreateAccount(publicKey);
            setAddress(address);
        }

        getAddress();
    }, [])

    return (
        <StyledContainer>
            <StyledTitle>Ledger Flow</StyledTitle>
            <StyledSubtitle>Please follow the instructions on your ledger device.</StyledSubtitle>
            <div>Address: {address}</div>
        </StyledContainer>    
    )
}
