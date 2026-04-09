import { create } from 'zustand'
import api from '../api/client'

interface ConfigState {
  config: Record<string, any> | null
  loading: boolean
  fetchConfig: () => Promise<void>
  saveConfig: (config: Record<string, any>) => Promise<void>
  updateField: (path: string[], value: any) => void
}

function setNested(obj: Record<string, any>, path: string[], value: any) {
  let current = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]]) current[path[i]] = {}
    current = current[path[i]]
  }
  current[path[path.length - 1]] = value
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,

  fetchConfig: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/config')
      set({ config: res.data })
    } finally {
      set({ loading: false })
    }
  },

  saveConfig: async (config) => {
    await api.put('/config', config)
    set({ config })
  },

  updateField: (path, value) => {
    const config = { ...get().config }
    setNested(config, path, value)
    set({ config })
  },
}))
