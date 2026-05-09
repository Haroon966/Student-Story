import { db, type AppSettings } from '@/db/database'
import { create } from 'zustand'

const SETTINGS_ID = 'app' as const

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

export const GROQ_MODEL_PRESETS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (128K context)' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (fast)' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (32K)' },
] as const

type SettingsPatch = Partial<
  Pick<AppSettings, 'groqApiKey' | 'groqModel' | 'systemPromptExtra' | 'educatorName' | 'educatorDescription'>
> & {
  educatorProfilePhoto?: Blob | null
}

type SettingsState = {
  settings: AppSettings | null
  loading: boolean
  hydrate: () => Promise<void>
  save: (patch: SettingsPatch) => Promise<void>
  clearApiKey: () => Promise<void>
  clearAllAiChats: () => Promise<void>
}

function defaultSettings(): AppSettings {
  return {
    id: SETTINGS_ID,
    groqApiKey: '',
    groqModel: DEFAULT_MODEL,
    systemPromptExtra: '',
    updatedAt: Date.now(),
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: true,

  hydrate: async () => {
    let row = await db.appSettings.get(SETTINGS_ID)
    if (!row) {
      row = defaultSettings()
      await db.appSettings.put(row)
    }
    set({ settings: row, loading: false })
  },

  save: async (patch) => {
    const prev = (await db.appSettings.get(SETTINGS_ID)) ?? defaultSettings()
    const photoPatch = 'educatorProfilePhoto' in patch ? patch.educatorProfilePhoto : undefined

    const next: AppSettings = {
      ...prev,
      groqApiKey: patch.groqApiKey !== undefined ? patch.groqApiKey : prev.groqApiKey,
      groqModel: patch.groqModel !== undefined ? patch.groqModel : prev.groqModel,
      systemPromptExtra: patch.systemPromptExtra !== undefined ? patch.systemPromptExtra : prev.systemPromptExtra,
      educatorName: patch.educatorName !== undefined ? patch.educatorName : prev.educatorName,
      educatorDescription: patch.educatorDescription !== undefined ? patch.educatorDescription : prev.educatorDescription,
      id: SETTINGS_ID,
      updatedAt: Date.now(),
    }

    if (photoPatch === null) {
      delete next.educatorProfilePhoto
    } else if (photoPatch !== undefined) {
      next.educatorProfilePhoto = photoPatch
    }

    await db.appSettings.put(next)
    set({ settings: next })
  },

  clearApiKey: async () => {
    await get().save({ groqApiKey: '' })
  },

  clearAllAiChats: async () => {
    await db.aiMessages.clear()
  },
}))

export { DEFAULT_MODEL }
