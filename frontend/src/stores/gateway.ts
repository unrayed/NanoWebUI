import { create } from 'zustand'
import api from '../api/client'

interface GatewayStatus {
  running: boolean
  mode: 'local' | 'remote'
  pid: number | null
}

interface GatewayState {
  status: GatewayStatus | null
  logs: string[]
  wsConnected: boolean
  fetchStatus: () => Promise<void>
  fetchLogs: () => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  restart: () => Promise<void>
  connectWebSocket: () => void
  disconnectWebSocket: () => void
}

let ws: WebSocket | null = null

export const useGatewayStore = create<GatewayState>((set, get) => ({
  status: null,
  logs: [],
  wsConnected: false,

  fetchStatus: async () => {
    const res = await api.get('/gateway/status')
    set({ status: res.data })
  },

  fetchLogs: async () => {
    const res = await api.get('/gateway/logs')
    set({ logs: res.data.logs || [] })
  },

  start: async () => {
    await api.post('/gateway/start')
    await get().fetchStatus()
  },

  stop: async () => {
    await api.post('/gateway/stop')
    await get().fetchStatus()
  },

  restart: async () => {
    await api.post('/gateway/restart')
    await get().fetchStatus()
  },

  connectWebSocket: () => {
    if (ws) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws/logs`
    ws = new WebSocket(url)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'log') {
          set((state) => ({ logs: [...state.logs.slice(-4999), msg.data] }))
        }
      } catch {
        // ignore parse errors
      }
    }
    ws.onclose = () => {
      set({ wsConnected: false })
      ws = null
      setTimeout(() => get().connectWebSocket(), 5000)
    }
    ws.onopen = () => set({ wsConnected: true })
  },

  disconnectWebSocket: () => {
    if (ws) {
      ws.close()
      ws = null
    }
  },
}))
