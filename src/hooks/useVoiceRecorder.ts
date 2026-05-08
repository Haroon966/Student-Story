import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceRecorderState =
  | { status: 'idle' }
  | { status: 'recording'; mimeType: string }
  | { status: 'error'; message: string }

const WAVE_BAR_COUNT = 28

function pickMimeType(): string {
  const preferred = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  for (const t of preferred) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({ status: 'idle' })
  const [waveLevels, setWaveLevels] = useState<number[]>(() =>
    Array.from({ length: WAVE_BAR_COUNT }, () => 0),
  )
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    analyserRef.current = null
    const ctx = audioCtxRef.current
    audioCtxRef.current = null
    void ctx?.close()
    setWaveLevels(Array.from({ length: WAVE_BAR_COUNT }, () => 0))
  }, [])

  const startAnalyser = useCallback((stream: MediaStream) => {
    stopAnalyser()
    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    void audioCtx.resume().catch(() => {})
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.45
    source.connect(analyser)
    analyserRef.current = analyser

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const slice = WAVE_BAR_COUNT
    const step = Math.max(1, Math.floor(bufferLength / slice))

    const tick = () => {
      const a = analyserRef.current
      if (!a) return
      a.getByteFrequencyData(dataArray)
      const levels: number[] = []
      for (let i = 0; i < slice; i++) {
        let sum = 0
        let count = 0
        for (let j = 0; j < step && i * step + j < bufferLength; j++) {
          sum += dataArray[i * step + j] ?? 0
          count++
        }
        levels.push(count ? sum / count / 255 : 0)
      }
      setWaveLevels(levels)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopAnalyser])

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const stop = useCallback(async (): Promise<Blob | null> => {
    const rec = recorderRef.current
    recorderRef.current = null
    if (!rec || rec.state === 'inactive') {
      stopAnalyser()
      stopTracks()
      setState({ status: 'idle' })
      return null
    }

    return await new Promise<Blob | null>((resolve) => {
      rec.onstop = () => {
        stopAnalyser()
        const mimeType = rec.mimeType || pickMimeType() || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        stopTracks()
        setState({ status: 'idle' })
        resolve(blob.size ? blob : null)
      }
      rec.stop()
    })
  }, [stopAnalyser, stopTracks])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ status: 'error', message: 'Microphone is not available in this browser.' })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      startAnalyser(stream)

      const mimeType = pickMimeType()
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data)
      }

      recorderRef.current = rec
      rec.start()
      setState({ status: 'recording', mimeType: rec.mimeType || mimeType || 'audio/webm' })
    } catch {
      stopAnalyser()
      stopTracks()
      setState({ status: 'error', message: 'Microphone permission was denied or unavailable.' })
    }
  }, [startAnalyser, stopAnalyser, stopTracks])

  const resetError = useCallback(() => setState({ status: 'idle' }), [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      void audioCtxRef.current?.close()
    }
  }, [])

  return { state, start, stop, resetError, waveLevels }
}
