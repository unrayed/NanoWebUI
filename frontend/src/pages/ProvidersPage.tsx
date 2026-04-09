import { useEffect, useState } from 'react'
import { useConfigStore } from '../stores/config'
import { useProvidersStore } from '../stores/providers'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { KeyRound, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react'

export default function ProvidersPage() {
  const providers = useProvidersStore((s) => s.providers)
  const loading = useProvidersStore((s) => s.loading)
  const fetchProviders = useProvidersStore((s) => s.fetchProviders)
  const testProvider = useProvidersStore((s) => s.testProvider)
  const config = useConfigStore((s) => s.config)
  const saveConfig = useConfigStore((s) => s.saveConfig)
  const updateField = useConfigStore((s) => s.updateField)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveConfig(config!)
      setMessage({ type: 'success', text: 'Config saved successfully' })
      await fetchProviders()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save config' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (name: string) => {
    setTesting(name)
    try {
      const result = await testProvider(name)
      setTestResults((prev) => ({ ...prev, [name]: result }))
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Providers</h2>
          <p className="text-sm text-gray-500 mt-1">Configure LLM providers and API keys</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          Save All
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const testResult = testResults[provider.name]
          const isTesting = testing === provider.name

          return (
            <Card key={provider.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className={`w-4 h-4 ${provider.configured ? 'text-green-600' : 'text-gray-400'}`} />
                    <CardTitle>{provider.displayName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.isGateway && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                        Gateway
                      </span>
                    )}
                    {provider.supportsPromptCaching && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Cache
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  label="API Key"
                  type="password"
                  value={provider.apiKey || ''}
                  onChange={(e) => {
                    updateField(['providers', provider.name, 'apiKey'], e.target.value)
                    setTestResults((prev) => {
                      const next = { ...prev }
                      delete next[provider.name]
                      return next
                    })
                  }}
                  placeholder={provider.envKey ? `$${provider.envKey}` : 'Enter API key'}
                />
                <Input
                  label="API Base URL"
                  value={provider.apiBase || ''}
                  onChange={(e) => updateField(['providers', provider.name, 'apiBase'], e.target.value || null)}
                  placeholder={provider.defaultApiBase || 'Default'}
                />

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(provider.name)}
                    loading={isTesting}
                    disabled={!provider.apiKey}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>

                  {testResult && (
                    <div className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span className="text-xs">{testResult.message}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
