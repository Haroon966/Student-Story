import type {
  AutomaticSpeechRecognitionOutput,
  AutomaticSpeechRecognitionPipeline,
} from '@xenova/transformers'

/** Multilingual Whisper tiny (ONNX via Transformers.js); loaded lazily at runtime from HF CDN. */
const DEFAULT_MODEL = 'Xenova/whisper-tiny'

/** Subset of `@xenova/transformers` `env` used for ONNX/WASM (matches `onnxruntime-common` Env). */
type TransformersOnnxEnv = {
  backends: {
    onnx: {
      logLevel?: string
      wasm: {
        numThreads?: number
        wasmPaths?: string
      }
    }
  }
}

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null

let onnxSessionCreatePatched = false

/**
 * ORT WASM defaults session `logSeverityLevel` to warning (2), which logs CleanUnusedInitializers noise from Whisper ONNX.
 * Patch session creation so `logSeverityLevel` is fatal (4).
 */
async function patchOrtSessionLogLevel(): Promise<void> {
  if (onnxSessionCreatePatched) return
  onnxSessionCreatePatched = true

  const ort = await import('onnxruntime-web')
  ort.env.logLevel = 'fatal'

  const Session = ort.InferenceSession
  const origCreate = Session.create.bind(Session) as (...args: unknown[]) => Promise<unknown>

  Session.create = (async (first: unknown, ...rest: unknown[]) => {
    const last = rest[rest.length - 1]
    if (rest.length > 0 && typeof last === 'object' && last !== null && !Array.isArray(last)) {
      const head = rest.slice(0, -1)
      const merged = { ...(last as Record<string, unknown>), logSeverityLevel: 4 }
      return origCreate(first, ...head, merged)
    }
    return origCreate(first, ...rest)
  }) as typeof Session.create
}

function configureOnnxForVite(env: TransformersOnnxEnv) {
  const onnx = env.backends.onnx
  onnx.logLevel = 'fatal'
  /** Single-thread WASM avoids worker/blob edge cases on static hosts (e.g. GitHub Pages). */
  onnx.wasm.numThreads = 1
  /**
   * Vite does not emit ORT .wasm next to chunks; we copy `node_modules/onnxruntime-web/dist/*.wasm` → `public/onnx/`.
   * @see vite.config.ts `copy-onnx-wasm`
   */
  const base = import.meta.env.BASE_URL
  const prefix = base.endsWith('/') ? base : `${base}/`
  onnx.wasm.wasmPaths = `${prefix}onnx/`
}

async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers')
      env.allowLocalModels = false
      configureOnnxForVite(env as TransformersOnnxEnv)
      await patchOrtSessionLogLevel()
      return pipeline('automatic-speech-recognition', DEFAULT_MODEL)
    })()
  }
  return transcriberPromise
}

function normalizeOutputText(
  out: AutomaticSpeechRecognitionOutput | AutomaticSpeechRecognitionOutput[],
): string {
  if (Array.isArray(out)) {
    return (out[0]?.text ?? '').trim()
  }
  return (out.text ?? '').trim()
}

/**
 * Transcribes recorded audio in the browser (WebAssembly). First call downloads model weights.
 */
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  if (!blob.size) return ''

  const objectUrl = URL.createObjectURL(blob)
  try {
    const transcriber = await getTranscriber()
    const raw = await transcriber(objectUrl, {
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5,
    })
    return normalizeOutputText(raw)
  } catch (err) {
    console.error('[transcribeAudioBlob]', err)
    const detail = err instanceof Error ? err.message : String(err)
    const message =
      detail.length > 0
        ? `Could not transcribe audio (${detail}). Check your connection, try a shorter clip, or another browser.`
        : 'Could not transcribe audio. Check your connection, try a shorter clip, or another browser.'
    throw new Error(message, { cause: err })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
