import React, {useEffect} from 'react'
import styled from 'styled-components'
import {showAddress} from "../ledger/ledger.js"

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

    useEffect(() => {
        // Do Ledger Stuff to get address, otherwise create acct.

        showAddress()
    }, [])

    return (
        <StyledContainer>
            <StyledTitle>Ledger Flow</StyledTitle>
            <StyledSubtitle>Please follow the instructions on your ledger device.</StyledSubtitle>
        </StyledContainer>    
    )
}
