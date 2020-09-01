import {useEffect} from "react"
import {config} from "@onflow/config"

export function MainnetConfig() {
  useEffect(() => {
    config()
      .put("accessNode.api", "https://access.onflow.org")
  }, [])
  return null
}