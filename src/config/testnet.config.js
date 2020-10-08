import {useEffect} from "react"
import {config} from "@onflow/config"

export function TestnetConfig() {
  useEffect(() => {
    config()
      .put("accessNode.api", "https://access-testnet.onflow.org")
  }, [])
  return null
}
