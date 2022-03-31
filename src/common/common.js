import styled from "styled-components"

export const StyledContainer = styled.div`
  width: 100%;
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`

export const StyledMessageWrapper = styled.div`
  width: 100%;
  font-size: 1rem;
  text-align: center;
`

export const AccountList = styled.div`
  width: 100%;

  div:last-child {
    border-bottom: none;
  }
`
export const AccountItem = styled.button`
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border: none;
  border-bottom: 1px solid #02D87E;
  background: unset;
  cursor: pointer;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  padding-top: 1rem;

  transition: background-color 0.1s;

  &:hover {
    background-color: #f8f8f8;
  }
`

export const AccountItemAddress = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: #2a2825;
}
`

export const AccountItemBalance = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  font-size: 0.75rem;
  color: #2a2825;
  opacity: 0.75;
`

export const Button = styled.button`
  -webkit-appearance: none;
  -moz-appearance: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
  width: 100%;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
  background-color: #02D87E;
  color: white;
`

export const Currency = styled.div`
  margin-left: 0.25rem;
  font-size: 0.5rem;
  font-weight: bold;
`

export const OutlineButton = styled(Button)`
  border: 1px solid #02D87E;
  background-color: white;
  color: #02D87E;
`

export const HorizontalSpacer = styled.div`
  margin: 0.5rem;
`

export const Column = styled.div`
  width: 100%;
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

export const Centered = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

export const LedgerTitle = styled.div`
  margin-left: 0.5rem;
  transform: translateY(4px);
  font-weight: 400;
  font-size: 2rem;
  text-decoration: none;
  color: #2a2825;
`

export const LedgerImage = styled.img`
  height: 4rem;
`;

export const Text = styled.div`
  margin-top: 1rem;
  min-height: 3rem;
  text-align: center;
`;

export const Error = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
  min-height: 3rem;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: left;
  color: white;
  background-color: #FC4C2E;
  box-sizing: border-box;
`;

export const Message = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

export const TextCenter = styled.div`
  text-align: center;
`

export const HorizontalLine = styled.hr`
  color: white;
  border: 1px solid white;
`

export const LogoSpinner = styled.img`
    @keyframes spin {
        0%   {transform: rotate(0deg);}
        25%  {transform: rotate(810deg);}
        50% {transform: rotate(700deg);}
        60% {transform: rotate(725deg);}
        65% {transform: rotate(720deg);}
        100% {transform: rotate(720deg);}
    }

    margin-top: 2rem;
    height: 2rem;
    width: auto;
    animation-name: spin;
    animation-duration: 5s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-direction: forwards;
    animation-delay: 1s;
    opacity: 0.75
`