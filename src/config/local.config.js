  
import {useEffect} from "react"
import {config} from "@onflow/config"

export function LocalConfig() {
  useEffect(() => {
    config()
      .put("accessNode.api", "http://localhost:8080")
  }, [])
  return null
}