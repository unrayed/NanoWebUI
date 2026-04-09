import { useEffect, useState } from 'react'
import { useConfigStore } from '../stores/config'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Toggle from '../components/Toggle'
import { Save, Loader2, Plus, Trash2, Server } from 'lucide-react'

export default function ToolsPage() {
  const config = useConfigStore((s) => s.config)
  const loading = useConfigStore((s) => s.loading)
  const fetchConfig = useConfigStore((s) => s.fetchConfig)
  const saveConfig = useConfigStore((s) => s.saveConfig)
  const updateField = useConfigStore((s) => s.updateField)
  const [saving, setSaving] = useState(false)
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

  const mcpServers: Record<string, any> = g(['tools', 'mcpServers']) || {}

  const addMcpServer = () => {
    const name = `server_${Object.keys(mcpServers).length + 1}`
    updateField(['tools', 'mcpServers', name], {
      type: 'stdio',
      command: '',
      args: [],
      env: {},
      url: '',
      headers: {},
      toolTimeout: 30,
      enabledTools: ['*'],
    })
  }

  const removeMcpServer = (name: string) => {
    const updated = { ...mcpServers }
    delete updated[name]
    updateField(['tools', 'mcpServers'], updated)
  }

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
          <h2 className="text-2xl font-bold text-gray-900">Tools</h2>
          <p className="text-sm text-gray-500 mt-1">Configure tools, web search, and MCP servers</p>
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

      <Card>
        <CardHeader><CardTitle>Web Search</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Enable Web Tools"
            description="Allow web search and fetch tools"
            checked={g(['tools', 'web', 'enable']) ?? true}
            onChange={(v) => updateField(['tools', 'web', 'enable'], v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Search Provider"
              value={g(['tools', 'web', 'search', 'provider']) || ''}
              onChange={(e) => updateField(['tools', 'web', 'search', 'provider'], e.target.value)}
              placeholder="duckduckgo"
            />
            <Input
              label="Max Results"
              type="number"
              value={g(['tools', 'web', 'search', 'maxResults']) ?? 5}
              onChange={(e) => updateField(['tools', 'web', 'search', 'maxResults'], parseInt(e.target.value))}
            />
          </div>
          <Input
            label="Search API Key"
            type="password"
            value={g(['tools', 'web', 'search', 'apiKey']) || ''}
            onChange={(e) => updateField(['tools', 'web', 'search', 'apiKey'], e.target.value)}
            placeholder="Optional (for Brave, Tavily, etc.)"
          />
          <Input
            label="Search Base URL"
            value={g(['tools', 'web', 'search', 'baseUrl']) || ''}
            onChange={(e) => updateField(['tools', 'web', 'search', 'baseUrl'], e.target.value)}
            placeholder="Optional (for SearXNG, etc.)"
          />
          <Input
            label="Proxy"
            value={g(['tools', 'web', 'proxy']) || ''}
            onChange={(e) => updateField(['tools', 'web', 'proxy'], e.target.value || null)}
            placeholder="Optional proxy URL"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Shell Execution</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Enable Exec Tool"
            description="Allow shell command execution"
            checked={g(['tools', 'exec', 'enable']) ?? true}
            onChange={(v) => updateField(['tools', 'exec', 'enable'], v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Timeout (seconds)"
              type="number"
              value={g(['tools', 'exec', 'timeout']) ?? 60}
              onChange={(e) => updateField(['tools', 'exec', 'timeout'], parseInt(e.target.value))}
            />
            <Input
              label="Sandbox"
              value={g(['tools', 'exec', 'sandbox']) || ''}
              onChange={(e) => updateField(['tools', 'exec', 'sandbox'], e.target.value)}
              placeholder="bubblewrap or empty for none"
            />
          </div>
          <Input
            label="Path Append"
            value={g(['tools', 'exec', 'pathAppend']) || ''}
            onChange={(e) => updateField(['tools', 'exec', 'pathAppend'], e.target.value)}
            placeholder="Additional PATH entries"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            label="Restrict to Workspace"
            description="Limit file operations to workspace directory"
            checked={g(['tools', 'restrictToWorkspace']) ?? false}
            onChange={(v) => updateField(['tools', 'restrictToWorkspace'], v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>MCP Servers</CardTitle>
            <Button variant="outline" size="sm" onClick={addMcpServer}>
              <Plus className="w-4 h-4 mr-1" />
              Add Server
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(mcpServers).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No MCP servers configured</p>
          )}
          {Object.entries(mcpServers).map(([name, server]: [string, any]) => (
            <div key={name} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMcpServer(name)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Type"
                  value={server.type || ''}
                  onChange={(e) => updateField(['tools', 'mcpServers', name, 'type'], e.target.value || null)}
                  placeholder="stdio, sse, streamableHttp"
                />
                <Input
                  label="Command"
                  value={server.command || ''}
                  onChange={(e) => updateField(['tools', 'mcpServers', name, 'command'], e.target.value)}
                  placeholder="Command (for stdio)"
                />
              </div>
              <Input
                label="URL"
                value={server.url || ''}
                onChange={(e) => updateField(['tools', 'mcpServers', name, 'url'], e.target.value)}
                placeholder="URL (for sse/streamableHttp)"
              />
              <Input
                label="Args (comma separated)"
                value={(server.args || []).join(', ')}
                onChange={(e) =>
                  updateField(
                    ['tools', 'mcpServers', name, 'args'],
                    e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="--arg1, --arg2"
              />
              <Input
                label="Tool Timeout (seconds)"
                type="number"
                value={server.toolTimeout ?? 30}
                onChange={(e) => updateField(['tools', 'mcpServers', name, 'toolTimeout'], parseInt(e.target.value))}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
