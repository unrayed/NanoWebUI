import { useEffect, useState } from 'react'
import { useGatewayStore } from '../stores/gateway'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import Button from '../components/Button'
import { Play, Square, RotateCw, Terminal, Activity, Wifi, WifiOff } from 'lucide-react'

export default function Dashboard() {
  const status = useGatewayStore((s) => s.status)
  const logs = useGatewayStore((s) => s.logs)
  const wsConnected = useGatewayStore((s) => s.wsConnected)
  const fetchStatus = useGatewayStore((s) => s.fetchStatus)
  const fetchLogs = useGatewayStore((s) => s.fetchLogs)
  const start = useGatewayStore((s) => s.start)
  const stop = useGatewayStore((s) => s.stop)
  const restart = useGatewayStore((s) => s.restart)
  const connectWebSocket = useGatewayStore((s) => s.connectWebSocket)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    fetchLogs()
    connectWebSocket()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus, fetchLogs, connectWebSocket])

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setActionLoading(action)
    try {
      await fn()
    } finally {
      setActionLoading(null)
    }
  }

  const isRunning = status?.running ?? false
  const mode = status?.mode ?? 'local'

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Monitor and control your nanobot gateway</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isRunning ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Activity className={`w-5 h-5 ${isRunning ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gateway</p>
                <p className={`font-semibold ${isRunning ? 'text-green-700' : 'text-gray-700'}`}>
                  {isRunning ? 'Running' : 'Stopped'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                {mode === 'local' ? (
                  <Wifi className="w-5 h-5 text-blue-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Mode</p>
                <p className="font-semibold text-gray-700 capitalize">{mode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${wsConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Terminal className={`w-5 h-5 ${wsConnected ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Log Stream</p>
                <p className={`font-semibold ${wsConnected ? 'text-green-700' : 'text-gray-700'}`}>
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {mode === 'local' && (
        <Card>
          <CardHeader>
            <CardTitle>Gateway Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleAction('start', start)}
                loading={actionLoading === 'start'}
                disabled={isRunning}
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('stop', stop)}
                loading={actionLoading === 'stop'}
                disabled={!isRunning}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('restart', restart)}
                loading={actionLoading === 'restart'}
                disabled={!isRunning}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-gray-950 rounded-b-xl p-4 font-mono text-xs text-gray-300 h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">No logs yet{mode === 'remote' ? '. Logs are only available in local mode.' : '.'}</p>
            ) : (
              logs.map((line, i) => (
                <div key={i} className="leading-relaxed whitespace-pre-wrap break-all">
                  {line}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
