import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { testGroqConnection } from '@/lib/groq'
import { DEFAULT_MODEL, GROQ_MODEL_PRESETS, useSettingsStore } from '@/stores/settingsStore'
import { Bot, ChevronLeft, ChevronRight, Eye, EyeOff, Info, Loader2, MessageSquareX, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function SettingsSection({
  icon,
  iconBg,
  title,
  description,
  danger = false,
  children,
}: {
  icon: React.ReactNode
  iconBg?: string
  title: string
  description?: React.ReactNode
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border"
      style={{
        borderColor: danger ? 'rgb(192 40 28 / 0.28)' : 'var(--theme-border)',
        borderLeft: danger ? '4px solid var(--theme-danger)' : undefined,
        background: danger ? 'var(--theme-danger-bg)' : 'var(--theme-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start gap-3.5 px-5 pt-5">
        <span
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ background: iconBg ?? (danger ? 'var(--theme-danger-bg)' : 'var(--theme-primary-soft)'), color: danger ? 'var(--theme-danger)' : 'var(--theme-primary)' }}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="font-semibold"
            style={{ fontSize: 'var(--text-base)', color: danger ? 'var(--theme-danger)' : 'var(--theme-charcoal)', lineHeight: 'var(--leading-tight)' }}
          >
            {title}
          </p>
          {description ? (
            <div className="mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
              {description}
            </div>
          ) : null}
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { settings, loading, hydrate, save, clearApiKey, clearAllAiChats } = useSettingsStore()
  const [keyInput,     setKeyInput]     = useState('')
  const [showKey,      setShowKey]      = useState(false)
  const [modelChoice,  setModelChoice]  = useState<string>(DEFAULT_MODEL)
  const [customModel,  setCustomModel]  = useState('')
  const [extraPrompt,  setExtraPrompt]  = useState('')
  const [testStatus,   setTestStatus]   = useState<string | null>(null)
  const [testBusy,     setTestBusy]     = useState(false)
  const [saveBusy,     setSaveBusy]     = useState(false)
  const [clearAiBusy,  setClearAiBusy]  = useState(false)

  useEffect(() => { void hydrate() }, [hydrate])

  useEffect(() => {
    if (!settings) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setKeyInput(settings.groqApiKey)
    const preset = GROQ_MODEL_PRESETS.some((p) => p.value === settings.groqModel)
    if (preset) { setModelChoice(settings.groqModel); setCustomModel('') }
    else         { setModelChoice('custom'); setCustomModel(settings.groqModel) }
    setExtraPrompt(settings.systemPromptExtra)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [settings])

  const resolvedModel = modelChoice === 'custom' ? customModel.trim() : modelChoice

  async function handleSave() {
    if (!resolvedModel) return
    setSaveBusy(true)
    try { await save({ groqApiKey: keyInput.trim(), groqModel: resolvedModel, systemPromptExtra: extraPrompt.trim() }) }
    finally { setSaveBusy(false) }
  }

  async function handleTest() {
    const key = keyInput.trim()
    if (!key) { setTestStatus('Enter an API key first.'); return }
    setTestBusy(true); setTestStatus(null)
    try { await testGroqConnection(key); setTestStatus('Connection OK — key is valid.') }
    catch (e) { setTestStatus(e instanceof Error ? e.message : 'Connection failed.') }
    finally { setTestBusy(false) }
  }

  async function handleClearAi() {
    const ok = window.confirm('Delete all AI coach conversations for every student on this device?')
    if (!ok) return
    setClearAiBusy(true)
    try { await clearAllAiChats() }
    finally { setClearAiBusy(false) }
  }

  if (loading || !settings) {
    return (
      <div className="flex flex-1 items-center justify-center py-16" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-3 pb-8 pt-4 sm:px-4">

      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
          <Link to="/"><ChevronLeft className="size-4" aria-hidden />Stories</Link>
        </Button>
      </div>

      {/* Page heading */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--theme-charcoal)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>
          Settings
        </h1>
        <p className="mt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
          Groq AI runs in your browser — your API key stays on this device and is never included in backups.
        </p>
      </div>

      {/* Groq API */}
      <SettingsSection icon={<Zap className="size-4" />} title="Groq API" description={<>Create a key at{' '}<a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="font-medium underline" style={{ color: 'var(--theme-primary)' }}>console.groq.com</a>.</>}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="groq-key" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>API key</Label>
            <div className="flex gap-2">
              <Input
                id="groq-key"
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="gsk_…"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label={showKey ? 'Hide key' : 'Show key'} onClick={() => setShowKey((s) => !s)}>
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="groq-model" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Model</Label>
            <select
              id="groq-model"
              className="flex h-10 w-full rounded-[var(--radius-md)] border px-3"
              style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)', fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal)' }}
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value)}
            >
              {GROQ_MODEL_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
              <option value="custom">Custom model id…</option>
            </select>
            {modelChoice === 'custom' ? (
              <Input value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="e.g. llama-3.3-70b-versatile" />
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
          {testStatus ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)' }}>{testStatus}</p>
          ) : null}
        </div>
      </SettingsSection>

      {/* AI coach instructions */}
      <SettingsSection icon={<Bot className="size-4" />} title="AI coach instructions" description="Extra guidance appended to the system prompt for every AI conversation.">
        <div className="flex flex-col gap-3">
          <Textarea
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            placeholder="e.g. Focus on positive framing and IEP-friendly language…"
            rows={4}
          />
          <div>
            <Button type="button" disabled={saveBusy} onClick={() => void handleSave()}>
              {saveBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              Save instructions
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* Clear AI conversations */}
      <SettingsSection icon={<MessageSquareX className="size-4" />} title="AI conversations" description="Remove all stored AI coach threads. Saved story entries are not affected." danger>
        <Button type="button" variant="destructive" disabled={clearAiBusy} onClick={() => void handleClearAi()}>
          {clearAiBusy ? <Loader2 className="size-4 animate-spin" /> : null}
          Clear all AI conversations
        </Button>
      </SettingsSection>

      {/* Credits card */}
      <Link
        to="/settings/credits"
        className="flex items-center justify-between rounded-[var(--radius-lg)] border px-5 py-4 transition-colors hover:bg-[var(--theme-primary-soft)]"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-[var(--radius-sm)]"
            style={{ background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}
          >
            <Info className="size-4" aria-hidden />
          </span>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--theme-charcoal)' }}>
            Credits &amp; license
          </span>
        </div>
        <ChevronRight className="size-5 text-[var(--theme-charcoal-muted)]" aria-hidden />
      </Link>

    </div>
  )
}
