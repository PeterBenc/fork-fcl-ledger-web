import {useEffect} from "react"
import {config} from "@onflow/config"

export function MainnetConfig() {
  useEffect(() => {
    config()
      .put("accessNode.api", "https://access-mainnet-beta.onflow.org")
  }, [])
  return null
}
