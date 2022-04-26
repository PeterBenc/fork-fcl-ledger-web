export const log = (...msgs) => {
    if (process.env.REACT_APP_ENABLE_LOGS || window.ENABLE_LOGS) {
        console.log(...msgs)
    }
}