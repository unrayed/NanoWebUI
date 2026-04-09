import { useEffect, useState } from 'react'
import { useConfigStore } from '../stores/config'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Toggle from '../components/Toggle'
import { Save, Loader2, Code } from 'lucide-react'

export default function ConfigEditor() {
  const config = useConfigStore((s) => s.config)
  const loading = useConfigStore((s) => s.loading)
  const fetchConfig = useConfigStore((s) => s.fetchConfig)
  const saveConfig = useConfigStore((s) => s.saveConfig)
  const updateField = useConfigStore((s) => s.updateField)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('agent')
  const [showJson, setShowJson] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveConfig(config!)
      setMessage({ type: 'success', text: 'Config saved successfully' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save config' })
    } finally {
      setSaving(false)
    }
  }

  const g = (path: string[]): any => {
    let current: any = config
    for (const key of path) {
      if (current == null) return undefined
      current = current[key]
    }
    return current
  }

  const tabs = [
    { id: 'agent', label: 'Agent' },
    { id: 'gateway', label: 'Gateway & API' },
    { id: 'channels', label: 'Channels' },
    { id: 'dream', label: 'Dream' },
    { id: 'json', label: 'JSON' },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Edit nanobot config settings</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save Config
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'agent' && (
        <Card>
          <CardHeader><CardTitle>Agent Defaults</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Model"
              value={g(['agents', 'defaults', 'model']) || ''}
              onChange={(e) => updateField(['agents', 'defaults', 'model'], e.target.value)}
              placeholder="anthropic/claude-opus-4-5"
            />
            <Input
              label="Provider"
              value={g(['agents', 'defaults', 'provider']) || ''}
              onChange={(e) => updateField(['agents', 'defaults', 'provider'], e.target.value)}
              placeholder="auto"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Tokens"
                type="number"
                value={g(['agents', 'defaults', 'maxTokens']) ?? 8192}
                onChange={(e) => updateField(['agents', 'defaults', 'maxTokens'], parseInt(e.target.value))}
              />
              <Input
                label="Context Window Tokens"
                type="number"
                value={g(['agents', 'defaults', 'contextWindowTokens']) ?? 65536}
                onChange={(e) => updateField(['agents', 'defaults', 'contextWindowTokens'], parseInt(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={g(['agents', 'defaults', 'temperature']) ?? 0.1}
                onChange={(e) => updateField(['agents', 'defaults', 'temperature'], parseFloat(e.target.value))}
              />
              <Input
                label="Max Tool Iterations"
                type="number"
                value={g(['agents', 'defaults', 'maxToolIterations']) ?? 200}
                onChange={(e) => updateField(['agents', 'defaults', 'maxToolIterations'], parseInt(e.target.value))}
              />
            </div>
            <Input
              label="Workspace Path"
              value={g(['agents', 'defaults', 'workspace']) || ''}
              onChange={(e) => updateField(['agents', 'defaults', 'workspace'], e.target.value)}
            />
            <Input
              label="Timezone"
              value={g(['agents', 'defaults', 'timezone']) || ''}
              onChange={(e) => updateField(['agents', 'defaults', 'timezone'], e.target.value)}
              placeholder="UTC"
            />
            <div className="space-y-3 pt-2">
              <Toggle
                label="Unified Session"
                description="Share one session across all channels"
                checked={g(['agents', 'defaults', 'unifiedSession']) ?? false}
                onChange={(v) => updateField(['agents', 'defaults', 'unifiedSession'], v)}
              />
              <Toggle
                label="Log Thought Blocks"
                description="Log LLM reasoning to console"
                checked={g(['agents', 'defaults', 'logThoughtBlocks']) ?? false}
                onChange={(v) => updateField(['agents', 'defaults', 'logThoughtBlocks'], v)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'gateway' && (
        <Card>
          <CardHeader><CardTitle>Gateway & API</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Gateway</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Host"
                value={g(['gateway', 'host']) || ''}
                onChange={(e) => updateField(['gateway', 'host'], e.target.value)}
              />
              <Input
                label="Port"
                type="number"
                value={g(['gateway', 'port']) ?? 18790}
                onChange={(e) => updateField(['gateway', 'port'], parseInt(e.target.value))}
              />
            </div>
            <Toggle
              label="Heartbeat"
              description="Periodic self-check tasks"
              checked={g(['gateway', 'heartbeat', 'enabled']) ?? true}
              onChange={(v) => updateField(['gateway', 'heartbeat', 'enabled'], v)}
            />
            <Input
              label="Heartbeat Interval (seconds)"
              type="number"
              value={g(['gateway', 'heartbeat', 'intervalS']) ?? 1800}
              onChange={(e) => updateField(['gateway', 'heartbeat', 'intervalS'], parseInt(e.target.value))}
            />

            <h4 className="text-sm font-semibold text-gray-700 pt-4">API Server</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="API Host"
                value={g(['api', 'host']) || ''}
                onChange={(e) => updateField(['api', 'host'], e.target.value)}
              />
              <Input
                label="API Port"
                type="number"
                value={g(['api', 'port']) ?? 8900}
                onChange={(e) => updateField(['api', 'port'], parseInt(e.target.value))}
              />
            </div>
            <Input
              label="API Timeout (seconds)"
              type="number"
              step="0.1"
              value={g(['api', 'timeout']) ?? 120}
              onChange={(e) => updateField(['api', 'timeout'], parseFloat(e.target.value))}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'channels' && (
        <Card>
          <CardHeader><CardTitle>Channel Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              label="Send Progress"
              description="Send typing indicators to channels"
              checked={g(['channels', 'sendProgress']) ?? true}
              onChange={(v) => updateField(['channels', 'sendProgress'], v)}
            />
            <Toggle
              label="Send Tool Hints"
              description="Show tool usage hints in chat"
              checked={g(['channels', 'sendToolHints']) ?? false}
              onChange={(v) => updateField(['channels', 'sendToolHints'], v)}
            />
            <Input
              label="Send Max Retries"
              type="number"
              min="0"
              max="10"
              value={g(['channels', 'sendMaxRetries']) ?? 3}
              onChange={(e) => updateField(['channels', 'sendMaxRetries'], parseInt(e.target.value))}
            />
            <Input
              label="Transcription Provider"
              value={g(['channels', 'transcriptionProvider']) || ''}
              onChange={(e) => updateField(['channels', 'transcriptionProvider'], e.target.value)}
              placeholder="groq"
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'dream' && (
        <Card>
          <CardHeader><CardTitle>Dream Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Dream Interval (hours)"
              type="number"
              min="1"
              value={g(['agents', 'defaults', 'dream', 'intervalH']) ?? 2}
              onChange={(e) => updateField(['agents', 'defaults', 'dream', 'intervalH'], parseInt(e.target.value))}
            />
            <Input
              label="Model Override"
              value={g(['agents', 'defaults', 'dream', 'modelOverride']) || ''}
              onChange={(e) => updateField(['agents', 'defaults', 'dream', 'modelOverride'], e.target.value || null)}
              placeholder="Leave empty to use default model"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Batch Size"
                type="number"
                min="1"
                value={g(['agents', 'defaults', 'dream', 'maxBatchSize']) ?? 20}
                onChange={(e) => updateField(['agents', 'defaults', 'dream', 'maxBatchSize'], parseInt(e.target.value))}
              />
              <Input
                label="Max Iterations"
                type="number"
                min="1"
                value={g(['agents', 'defaults', 'dream', 'maxIterations']) ?? 10}
                onChange={(e) => updateField(['agents', 'defaults', 'dream', 'maxIterations'], parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'json' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Raw JSON</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowJson(!showJson)}>
                <Code className="w-4 h-4 mr-2" />
                {showJson ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showJson && (
              <pre className="bg-gray-950 text-gray-300 p-4 rounded-lg text-xs font-mono overflow-auto max-h-96">
                {JSON.stringify(config, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
