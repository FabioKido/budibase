import { writable } from "svelte/store"
import { derivedMemo } from "../../../utils"

export const createStores = context => {
  const config = writable(context.props)
  const getProp = prop => derivedMemo(config, $config => $config[prop])

  // Derive and memoize some props so that we can react to them in isolation
  const tableId = getProp("tableId")
  const schemaOverrides = getProp("schemaOverrides")
  const notifySuccess = getProp("notifySuccess")
  const notifyError = getProp("notifyError")

  return {
    config,
    tableId,
    schemaOverrides,
    notifySuccess,
    notifyError,
  }
}
