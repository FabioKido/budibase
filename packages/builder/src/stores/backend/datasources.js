import { writable, derived, get } from "svelte/store"
import { IntegrationTypes } from "constants/backend"
import { queries, tables } from "./"
import { BUDIBASE_INTERNAL_DB_ID } from "constants/backend"
import { API } from "api"
import { DatasourceFeature } from "@budibase/types"

export function createDatasourcesStore() {
  const store = writable({
    list: [],
    selectedDatasourceId: BUDIBASE_INTERNAL_DB_ID,
    schemaError: null,
  })

  const derivedStore = derived(store, $store => ({
    ...$store,
    selected: $store.list?.find(ds => ds._id === $store.selectedDatasourceId),
  }))

  const fetch = async () => {
    const datasources = await API.getDatasources()
    store.update(state => ({
      ...state,
      list: datasources,
    }))
  }

  const select = id => {
    store.update(state => ({
      ...state,
      selectedDatasourceId: id,
      // Remove any possible schema error
      schemaError: null,
    }))
  }

  const updateDatasource = response => {
    const { datasource, error } = response

    store.update(state => {
      const currentIdx = state.list.findIndex(ds => ds._id === datasource._id)
      const sources = state.list
      if (currentIdx >= 0) {
        sources.splice(currentIdx, 1, datasource)
      } else {
        sources.push(datasource)
      }
      return {
        list: sources,
        selectedDatasourceId: datasource._id,
        schemaError: error,
      }
    })
    return datasource
  }

  const updateSchema = async (datasource, tablesFilter) => {
    const response = await API.buildDatasourceSchema({
      datasourceId: datasource?._id,
      tablesFilter,
    })
    return updateDatasource(response)
  }

  const sourceCount = source => {
    return get(store).list.filter(datasource => datasource.source === source)
      .length
  }

  const isDatasourceInvalid = async datasource => {
    if (datasource.features?.[DatasourceFeature.CONNECTION_CHECKING]) {
      const { connected } = await API.validateDatasource(datasource)
      if (!connected) return true
    }

    return false
  }

  const create = async ({ integration, fields }) => {
    const datasource = {
      type: "datasource",
      source: integration.name,
      config: fields,
      name: `${integration.friendlyName}-${sourceCount(integration.name) + 1}`,
      plus: integration.plus && integration.name !== IntegrationTypes.REST,
    }

    if (await isDatasourceInvalid(datasource)) {
      throw "Unable to connect"
    }

    const response = await API.createDatasource({
      datasource,
      fetchSchema:
        integration.plus && integration.name !== IntegrationTypes.GOOGLE_SHEETS,
    })

    return updateDatasource(response)
  }

  const save = async datasource => {
    if (await isDatasourceInvalid(datasource)) {
      throw "Unable to connect"
    }

    const response = await API.updateDatasource(datasource)

    return updateDatasource(response)
  }

  const deleteDatasource = async datasource => {
    await API.deleteDatasource({
      datasourceId: datasource?._id,
      datasourceRev: datasource?._rev,
    })
    store.update(state => {
      const sources = state.list.filter(
        existing => existing._id !== datasource._id
      )
      return { list: sources, selected: null, selectedDatasourceId: BUDIBASE_INTERNAL_DB_ID }
    })
    await queries.fetch()
    await tables.fetch()
  }

  const removeSchemaError = () => {
    store.update(state => {
      return { ...state, schemaError: null }
    })
  }

  // Handles external updates of datasources
  const replaceDatasource = (datasourceId, datasource) => {
    if (!datasourceId) {
      return
    }

    // Handle deletion
    if (!datasource) {
      store.update(state => ({
        ...state,
        list: state.list.filter(x => x._id !== datasourceId),
      }))
      return
    }

    // Add new datasource
    const index = get(store).list.findIndex(x => x._id === datasource._id)
    if (index === -1) {
      store.update(state => ({
        ...state,
        list: [...state.list, datasource],
      }))
    }

    // Update existing datasource
    else if (datasource) {
      store.update(state => {
        state.list[index] = datasource
        return state
      })
    }
  }

  return {
    subscribe: derivedStore.subscribe,
    fetch,
    init: fetch,
    select,
    updateSchema,
    create,
    save,
    delete: deleteDatasource,
    removeSchemaError,
    replaceDatasource,
    find,
  }
}

export const datasources = createDatasourcesStore()
