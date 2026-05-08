import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { testGroqConnection } from '@/lib/groq'
import { DEFAULT_MODEL, GROQ_MODEL_PRESETS, useSettingsStore } from '@/stores/settingsStore'
import { ChevronLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  const { settings, loading, hydrate, save, clearApiKey, clearAllAiChats } = useSettingsStore()
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [modelChoice, setModelChoice] = useState<string>(DEFAULT_MODEL)
  const [customModel, setCustomModel] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [testBusy, setTestBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [clearAiBusy, setClearAiBusy] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  /* Sync hydrated Dexie settings into draft form fields when settings row updates. */
  useEffect(() => {
    if (!settings) return
    /* eslint-disable react-hooks/set-state-in-effect -- draft form mirrors external store after hydrate */
    setKeyInput(settings.groqApiKey)
    const preset = GROQ_MODEL_PRESETS.some((p) => p.value === settings.groqModel)
    if (preset) {
      setModelChoice(settings.groqModel)
      setCustomModel('')
    } else {
      setModelChoice('custom')
      setCustomModel(settings.groqModel)
    }
    setExtraPrompt(settings.systemPromptExtra)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings])

  const resolvedModel = modelChoice === 'custom' ? customModel.trim() : modelChoice

  async function handleSave() {
    if (!resolvedModel) return
    setSaveBusy(true)
    try {
      await save({
        groqApiKey: keyInput.trim(),
        groqModel: resolvedModel,
        systemPromptExtra: extraPrompt.trim(),
      })
    } finally {
      setSaveBusy(false)
    }
  }

  async function handleTest() {
    const key = keyInput.trim()
    if (!key) {
      setTestStatus('Enter an API key first.')
      return
    }
    setTestBusy(true)
    setTestStatus(null)
    try {
      await testGroqConnection(key)
      setTestStatus('Connection OK — key is valid.')
    } catch (e) {
      setTestStatus(e instanceof Error ? e.message : 'Connection failed.')
    } finally {
      setTestBusy(false)
    }
  }

  async function handleClearAi() {
    const ok = window.confirm('Delete all AI coach conversations for every student on this device?')
    if (!ok) return
    setClearAiBusy(true)
    try {
      await clearAllAiChats()
    } finally {
      setClearAiBusy(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-[var(--theme-charcoal-muted)]">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-2 px-2">
          <Link to="/">
            <ChevronLeft className="size-4" aria-hidden />
            Stories
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-[var(--theme-charcoal)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--theme-charcoal-muted)]">
          Groq runs in your browser. Your API key stays in IndexedDB on this device only — it is never included in
          backups.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Groq API</CardTitle>
          <CardDescription>
            Create a key at{' '}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--theme-primary)] underline"
            >
              console.groq.com
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="groq-key">API key</Label>
            <div className="relative flex gap-2">
              <Input
                id="groq-key"
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="gsk_…"
                className="pr-10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label={showKey ? 'Hide key' : 'Show key'}
                onClick={() => setShowKey((s) => !s)}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="groq-model">Model</Label>
            <select
              id="groq-model"
              className="flex h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-sm text-[var(--theme-charcoal)]"
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value)}
            >
              {GROQ_MODEL_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Custom model id…</option>
            </select>
            {modelChoice === 'custom' ? (
              <Input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. llama-3.3-70b-versatile"
              />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={testBusy} onClick={() => void handleTest()}>
              {testBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              Test connection
            </Button>
            <Button type="button" disabled={saveBusy || !resolvedModel} onClick={() => void handleSave()}>
              {saveBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              Save settings
            </Button>
            <Button type="button" variant="outline" onClick={() => void clearApiKey()}>
              Clear key
            </Button>
          </div>
          {testStatus ? <p className="text-sm text-[var(--theme-charcoal-muted)]">{testStatus}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI coach instructions (optional)</CardTitle>
          <CardDescription>Extra guidance appended to the system prompt for every AI conversation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            placeholder="e.g. Focus on positive framing and IEP-friendly language…"
            rows={4}
          />
          <Button type="button" className="mt-3" disabled={saveBusy} onClick={() => void handleSave()}>
            Save instructions
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[var(--theme-danger)]/30 bg-[var(--theme-danger-bg)]">
        <CardHeader>
          <CardTitle className="text-base text-[var(--theme-danger)]">AI conversations</CardTitle>
          <CardDescription>Remove all stored AI coach threads. Saved story entries are not affected.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" disabled={clearAiBusy} onClick={() => void handleClearAi()}>
            {clearAiBusy ? <Loader2 className="size-4 animate-spin" /> : null}
            Clear all AI conversations
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
