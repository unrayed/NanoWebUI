import { create } from 'zustand'
import api from '../api/client'

interface Provider {
  name: string
  displayName: string
  envKey: string
  defaultApiBase: string | null
  backend: string
  isGateway: boolean
  supportsPromptCaching: boolean
  detectByKeyPrefix: string | null
  configured: boolean
  apiKey: string
  apiBase: string | null
}

interface ProvidersState {
  providers: Provider[]
  loading: boolean
  fetchProviders: () => Promise<void>
  testProvider: (name: string) => Promise<{ success: boolean; message: string }>
}

export const useProvidersStore = create<ProvidersState>((set) => ({
  providers: [],
  loading: false,

  fetchProviders: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/providers')
      set({ providers: res.data })
    } finally {
      set({ loading: false })
    }
  },

  testProvider: async (name) => {
    const res = await api.post(`/providers/${name}/test`)
    return res.data
  },
}))
