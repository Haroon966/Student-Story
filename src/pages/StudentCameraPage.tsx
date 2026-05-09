import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/stores/studentsStore'
import { Image as ImageIcon, SwitchCamera, X, Zap, ZapOff } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Webcam from 'react-webcam'

type FacingMode = 'user' | 'environment'
type CaptureMode = 'photo' | 'video'

const ZOOM_MIN = 1
const ZOOM_MAX = 3.5
const ZOOM_SNAP_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 3.5] as const
const LONG_PRESS_MS = 450
const SWIPE_LOCK_PX = 56

function trackSupportsTorch(track: MediaStreamTrack | undefined): boolean {
  if (!track?.getCapabilities) return false
  const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
  return Boolean(caps.torch)
}

async function setTrackTorch(track: MediaStreamTrack, on: boolean): Promise<void> {
  try {
    await track.applyConstraints({
      advanced: [{ torch: on } as MediaTrackConstraintSet],
    })
  } catch {
    // ignore
  }
}

/** Chrome/Android often expose focus modes; iOS Safari usually ignores this. */
async function applyContinuousAutofocus(track: MediaStreamTrack | undefined): Promise<void> {
  if (!track?.getCapabilities) return
  const caps = track.getCapabilities() as MediaTrackCapabilities & {
    focusMode?: string | string[]
  }
  const raw = caps.focusMode
  const modes = (Array.isArray(raw) ? raw : raw != null ? [raw] : []) as string[]
  if (!modes.includes('continuous') && !modes.includes('single-shot')) return
  const prefer = modes.includes('continuous') ? 'continuous' : 'single-shot'
  try {
    await track.applyConstraints({
      advanced: [{ focusMode: prefer } as MediaTrackConstraintSet],
    })
  } catch {
    // ignore — not supported on this device/browser
  }
}

function pickVideoMimeType(): string {
  const cands = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  for (const c of cands) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return 'video/webm'
}

function clampZoom(n: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n))
}

function zoomLabel(z: number): string {
  const s = z.toFixed(1).replace(/\.0$/, '')
  return `${s}×`
}

export function StudentCameraPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const students = useStudentsStore((s) => s.students)
  const loadingStudents = useStudentsStore((s) => s.loading)
  const student = id ? students.find((s) => s.id === id) : undefined

  const webcamRef = useRef<Webcam>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownRef = useRef<{ t: number; x: number; y: number; id: number } | null>(null)
  const longPressFiredRef = useRef(false)
  const pinchRef = useRef<{ d0: number; z0: number } | null>(null)
  const pinchRootRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef(1)
  const [pinchActive, setPinchActive] = useState(false)

  const captureModeRef = useRef<CaptureMode>('photo')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo')

  const [ready, setReady] = useState(false)
  const [facingMode, setFacingMode] = useState<FacingMode>('user')
  const [zoom, setZoom] = useState(1)
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordLocked, setRecordLocked] = useState(false)
  const isRecordingRef = useRef(false)
  const recordLockedRef = useRef(false)

  useEffect(() => {
    captureModeRef.current = captureMode
  }, [captureMode])

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    recordLockedRef.current = recordLocked
  }, [recordLocked])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  /** Native non-passive touchmove so two-finger pinch is not taken over by the browser (esp. iOS Safari). Re-binds after loading so the ref exists. */
  useLayoutEffect(() => {
    if (loadingStudents) return
    const el = pinchRootRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]]
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        pinchRef.current = { d0: Math.max(d, 1), z0: zoomRef.current }
        setPinchActive(true)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const [a, b] = [e.touches[0], e.touches[1]]
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      if (!pinchRef.current) {
        pinchRef.current = { d0: Math.max(d, 1), z0: zoomRef.current }
        setPinchActive(true)
      }
      const { d0, z0 } = pinchRef.current
      if (d0 < 1) return
      e.preventDefault()
      setZoom(clampZoom(z0 * (d / d0)))
    }

    const onTouchEndOrCancel = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null
        setPinchActive(false)
      }
    }

    /** Trackpad pinch / ctrl+scroll zoom (desktop). */
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06
      setZoom((z) => clampZoom(z * factor))
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEndOrCancel, { passive: true })
    el.addEventListener('touchcancel', onTouchEndOrCancel, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEndOrCancel)
      el.removeEventListener('touchcancel', onTouchEndOrCancel)
      el.removeEventListener('wheel', onWheel)
    }
  }, [loadingStudents, id])

  const onUserMedia = useCallback((stream: MediaStream) => {
    setMediaError(null)
    setReady(true)
    setTorchOn(false)
    const track = stream.getVideoTracks()[0]
    videoTrackRef.current = track ?? null
    setTorchSupported(trackSupportsTorch(track))
    void applyContinuousAutofocus(track)
  }, [])

  const onUserMediaError = useCallback((err: string | DOMException) => {
    setReady(false)
    videoTrackRef.current = null
    setTorchSupported(false)
    setTorchOn(false)
    const msg = typeof err === 'string' ? err : err.message
    setMediaError(msg || 'Could not open camera')
  }, [])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearLongPressTimer()
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        mr.onstop = null
        try {
          mr.stop()
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current = null
      isRecordingRef.current = false
      recordLockedRef.current = false
    }
  }, [clearLongPressTimer])

  const navigateWithStoryMedia = useCallback(
    (blob: Blob, mimeType: string, kind: 'image' | 'video') => {
      if (!id) return
      navigate(`/student/${id}`, {
        replace: true,
        state: {
          storyCameraCapture: {
            ingestId: crypto.randomUUID(),
            mimeType: mimeType || blob.type || (kind === 'video' ? 'video/webm' : 'image/jpeg'),
            blob,
            kind,
          },
        },
      })
    },
    [id, navigate],
  )

  const finalizeRecording = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (!mr || mr.state === 'inactive') return
    const mime = mr.mimeType || pickVideoMimeType()
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mime })
      recordedChunksRef.current = []
      mediaRecorderRef.current = null
      isRecordingRef.current = false
      recordLockedRef.current = false
      setIsRecording(false)
      setRecordLocked(false)
      longPressFiredRef.current = false
      if (blob.size > 0) {
        navigateWithStoryMedia(blob, mime, 'video')
      } else {
        setMediaError('Video was too short or could not be saved.')
      }
    }
    try {
      mr.stop()
    } catch {
      mediaRecorderRef.current = null
      isRecordingRef.current = false
      recordLockedRef.current = false
      setIsRecording(false)
      setRecordLocked(false)
    }
  }, [navigateWithStoryMedia])

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current) return
    const stream = webcamRef.current?.stream
    if (!stream || !id) return
    if (typeof MediaRecorder === 'undefined') {
      setMediaError('Video recording is not supported in this browser.')
      return
    }
    const mimeType = pickVideoMimeType()
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      setMediaError('No supported video format for recording.')
      return
    }
    try {
      recordedChunksRef.current = []
      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      mr.onerror = () => {
        setMediaError('Recording error.')
        isRecordingRef.current = false
        recordLockedRef.current = false
        setIsRecording(false)
        setRecordLocked(false)
        mediaRecorderRef.current = null
      }
      mediaRecorderRef.current = mr
      mr.start(200)
      isRecordingRef.current = true
      recordLockedRef.current = false
      setIsRecording(true)
      setRecordLocked(false)
    } catch {
      setMediaError('Could not start video recording.')
    }
  }, [id])

  const flipCamera = useCallback(async () => {
    if (isRecording) return
    if (torchOn && videoTrackRef.current) {
      await setTrackTorch(videoTrackRef.current, false)
      setTorchOn(false)
    }
    setReady(false)
    setMediaError(null)
    setZoom(1)
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }, [isRecording, torchOn])

  const stopZoomPointerBubble = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
  }, [])

  const cycleZoomSnap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom((z) => {
      const i = ZOOM_SNAP_STEPS.findIndex((s) => Math.abs(s - z) < 0.06)
      const next = (i >= 0 ? i + 1 : 0) % ZOOM_SNAP_STEPS.length
      return ZOOM_SNAP_STEPS[next] ?? 1
    })
  }, [])

  const toggleTorch = useCallback(async () => {
    const track = videoTrackRef.current
    if (!track || !torchSupported) return
    const next = !torchOn
    await setTrackTorch(track, next)
    setTorchOn(next)
  }, [torchOn, torchSupported])

  const torchOff = useCallback(async () => {
    const track = videoTrackRef.current
    if (!track || !torchOn) return
    await setTrackTorch(track, false)
    setTorchOn(false)
  }, [torchOn])

  const capture = useCallback(() => {
    const cam = webcamRef.current
    if (!cam || !id) return
    const video = cam.video
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      const canvas = cam.getCanvas({ width: video.videoWidth, height: video.videoHeight })
      if (canvas) {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              navigateWithStoryMedia(blob, blob.type || 'image/jpeg', 'image')
            }
          },
          'image/jpeg',
          1,
        )
        return
      }
    }
    const shot = cam.getScreenshot()
    if (!shot) return
    fetch(shot)
      .then((r) => r.blob())
      .then((blob) => navigateWithStoryMedia(blob, blob.type || 'image/jpeg', 'image'))
      .catch(() => {})
  }, [id, navigateWithStoryMedia])

  /** `ideal` resolution — browser picks the closest supported size. Focus is applied after connect (see `applyContinuousAutofocus`). */
  const videoConstraints = useMemo((): MediaTrackConstraints => {
    return {
      facingMode,
      width: { ideal: 1920, min: 320 },
      height: { ideal: 1080, min: 240 },
      frameRate: { ideal: 30, max: 60 },
    }
  }, [facingMode])

  const onGalleryFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !id) return
      if (!file.type.startsWith('image/')) return
      navigateWithStoryMedia(file, file.type, 'image')
    },
    [id, navigateWithStoryMedia],
  )

  /** Shutter: video mode pointer gestures */
  const onShutterPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (captureModeRef.current !== 'video' || !ready) return
      if (isRecordingRef.current && recordLockedRef.current) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      pointerDownRef.current = { t: Date.now(), x: e.clientX, y: e.clientY, id: e.pointerId }
      longPressFiredRef.current = false

      if (isRecordingRef.current) {
        clearLongPressTimer()
        return
      }

      longPressTimerRef.current = setTimeout(() => {
        longPressFiredRef.current = true
        startRecording()
      }, LONG_PRESS_MS)
    },
    [clearLongPressTimer, ready, startRecording],
  )

  const onShutterPointerMove = useCallback((e: React.PointerEvent) => {
    if (captureModeRef.current !== 'video' || !pointerDownRef.current) return
    const p = pointerDownRef.current
    if (e.pointerId !== p.id) return
    if (!isRecordingRef.current) return
    if (p.y - e.clientY > SWIPE_LOCK_PX) {
      recordLockedRef.current = true
      setRecordLocked(true)
    }
  }, [])

  const onShutterPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (captureModeRef.current !== 'video') return
      const p = pointerDownRef.current
      if (!p || e.pointerId !== p.id) return
      pointerDownRef.current = null
      clearLongPressTimer()

      if (!isRecordingRef.current) {
        longPressFiredRef.current = false
        return
      }

      const locked = recordLockedRef.current
      if (!locked) finalizeRecording()
      longPressFiredRef.current = false
    },
    [clearLongPressTimer, finalizeRecording],
  )

  const onShutterPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (pointerDownRef.current?.id !== e.pointerId) return
      pointerDownRef.current = null
      clearLongPressTimer()
      if (isRecordingRef.current && !recordLockedRef.current) {
        finalizeRecording()
      }
      longPressFiredRef.current = false
    },
    [clearLongPressTimer, finalizeRecording],
  )

  /** Locked recording: tap shutter to stop */
  const onShutterClickVideoLocked = useCallback(() => {
    if (captureMode !== 'video' || !isRecording || !recordLocked) return
    finalizeRecording()
  }, [captureMode, finalizeRecording, isRecording, recordLocked])

  if (!id) {
    return null
  }

  if (loadingStudents) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black py-16 text-sm text-white/70">
        Loading…
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white/90">
        <p className="text-sm text-white/70">This student story could not be found.</p>
        <Link
          to="/"
          className="rounded-full bg-[var(--theme-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--theme-primary)]"
        >
          Back to stories
        </Link>
      </div>
    )
  }

  const chatHref = `/student/${id}`

  if (student.blocked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--theme-chat-bg)] px-6 text-center">
        <p className="text-sm text-[var(--theme-charcoal-muted)]">Camera is unavailable while this student is blocked.</p>
        <Link
          to={chatHref}
          className="rounded-full bg-[var(--theme-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--theme-primary)]"
        >
          Back to story
        </Link>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <div className="relative min-h-0 flex-1 bg-black">
        <div
          ref={pinchRootRef}
          className="absolute inset-0 flex touch-none items-center justify-center overflow-hidden"
        >
          <div
            className={cn(
              'relative h-full w-full',
              pinchActive ? 'transition-none' : 'transition-transform duration-150 ease-out',
            )}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <Webcam
              key={facingMode}
              ref={webcamRef}
              audio={captureMode === 'video'}
              mirrored={facingMode === 'user'}
              screenshotFormat="image/jpeg"
              screenshotQuality={1}
              forceScreenshotSourceSize
              imageSmoothing={false}
              disablePictureInPicture
              videoConstraints={videoConstraints}
              onUserMedia={onUserMedia}
              onUserMediaError={onUserMediaError}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 grid grid-cols-3 items-start gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))] pb-3"
          style={{
            background: 'linear-gradient(to bottom, rgb(0 0 0 / 0.65) 0%, rgb(0 0 0 / 0.2) 70%, transparent 100%)',
          }}
        >
          <div className="flex justify-start">
            <Link
              to={chatHref}
              className="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15"
              aria-label="Close camera"
            >
              <X className="size-6" strokeWidth={2.2} aria-hidden />
            </Link>
          </div>

          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              disabled={!torchSupported || !ready || isRecording}
              onClick={() => void toggleTorch()}
              className={cn(
                'pointer-events-auto flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                torchOn
                  ? 'bg-amber-400/35 text-amber-100 ring-1 ring-amber-300/60'
                  : 'bg-white/12 text-white/90 ring-1 ring-white/20 hover:bg-white/18',
                (!torchSupported || !ready || isRecording) && 'opacity-40',
              )}
              aria-label={torchOn ? 'Flash on — tap to turn off' : 'Flash — tap if supported on this device'}
            >
              <Zap className={cn('size-5 shrink-0', torchOn && 'fill-amber-200 text-amber-50')} aria-hidden />
              {torchSupported ? (torchOn ? 'On' : 'Off') : '—'}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!torchOn}
              onClick={() => void torchOff()}
              className="pointer-events-auto flex size-11 items-center justify-center rounded-full text-white hover:bg-white/15 disabled:opacity-35"
              aria-label="Turn flash off"
            >
              <ZapOff className="size-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        {recordLocked && isRecording ? (
          <div className="pointer-events-none absolute bottom-24 left-0 right-0 z-[25] flex justify-center">
            <span className="rounded-full bg-red-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Locked · tap shutter to stop
            </span>
          </div>
        ) : null}

        {mediaError ? (
          <div className="absolute bottom-28 left-4 right-4 z-30 rounded-lg bg-red-950/95 px-3 py-2 text-center text-sm text-red-100 shadow-lg">
            {mediaError}
            <span className="mt-1 block text-xs text-red-200/90">Try another camera or check permissions.</span>
          </div>
        ) : null}
      </div>

      <div className="relative z-30 shrink-0 border-t border-white/10 bg-black px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <p className="mb-2 truncate text-center text-[11px] font-medium tracking-wide text-white/45">{student.name}</p>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-label="Photo from gallery"
          onChange={onGalleryFileChange}
        />

        <div className="mx-auto flex max-w-md items-center justify-center gap-5 px-3 pb-2 pt-1">
          <button
            type="button"
            disabled={isRecording}
            onClick={() => galleryInputRef.current?.click()}
            className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-md backdrop-blur-sm transition enabled:active:scale-95 enabled:hover:bg-white/18 disabled:opacity-35"
            aria-label="Choose from gallery"
          >
            <ImageIcon className="size-[22px]" strokeWidth={1.8} aria-hidden />
          </button>

          <div
            className={cn(
              'flex shrink-0 flex-col items-center gap-1.5',
              captureMode === 'video' && 'touch-none',
            )}
          >
            <button
              type="button"
              onClick={cycleZoomSnap}
              onPointerDown={stopZoomPointerBubble}
              onPointerMove={stopZoomPointerBubble}
              onPointerUp={stopZoomPointerBubble}
              onPointerCancel={stopZoomPointerBubble}
              className="pointer-events-auto min-w-[2.25rem] rounded-full border border-white/40 bg-[rgb(0_0_0_/_0.78)] px-2 py-0.5 text-[10px] font-semibold tabular-nums leading-none text-white shadow-md backdrop-blur-sm"
              aria-label={`Zoom ${zoomLabel(zoom)} — tap to step`}
            >
              {zoomLabel(zoom)}
            </button>
            <div className="relative flex size-[76px] shrink-0 items-center justify-center">
              <button
                type="button"
                disabled={!ready}
                aria-label={
                  captureMode === 'photo'
                    ? 'Take photo'
                    : isRecording && recordLocked
                      ? 'Stop recording'
                      : isRecording
                        ? 'Recording — release to stop, or swipe up to lock'
                        : 'Hold to record video'
                }
                className={cn(
                  'absolute inset-0 flex items-center justify-center rounded-full border-[5px] border-white bg-white/20 shadow-[0_0_0_5px_rgb(255_255_255_/_0.08)] transition enabled:hover:bg-white/28 disabled:opacity-45',
                  isRecording && 'border-red-400/90 bg-red-500/25 shadow-[0_0_0_5px_rgb(248_113_113_/_0.25)]',
                )}
                onClick={() => {
                  if (captureMode === 'photo') capture()
                  else if (isRecording && recordLocked) onShutterClickVideoLocked()
                }}
                onPointerDown={captureMode === 'video' ? onShutterPointerDown : undefined}
                onPointerMove={captureMode === 'video' ? onShutterPointerMove : undefined}
                onPointerUp={captureMode === 'video' ? onShutterPointerUp : undefined}
                onPointerCancel={captureMode === 'video' ? onShutterPointerCancel : undefined}
              >
                <span
                  className={cn(
                    'size-[58px] rounded-full shadow-inner',
                    isRecording ? 'bg-red-500' : 'bg-white',
                  )}
                />
                {isRecording ? (
                  <span className="absolute right-1 top-1 size-2.5 rounded-full bg-white ring-2 ring-red-500" aria-hidden />
                ) : null}
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={isRecording}
            onClick={() => void flipCamera()}
            className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-md transition enabled:active:scale-95 enabled:hover:bg-white/18 disabled:opacity-35"
            aria-label={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
          >
            <SwitchCamera className="size-[22px]" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <p className="mb-2 px-2 text-center text-[10px] leading-snug text-white/40">
          {captureMode === 'photo'
            ? 'Photo · tap shutter to capture · pinch to zoom camera'
            : 'Video · hold shutter to record, release to stop · swipe up while recording to lock · tap shutter when locked to stop · pinch to zoom camera'}
        </p>

        <div className="flex items-center justify-center gap-14 border-t border-white/10 px-6 py-3">
          <button
            type="button"
            className={cn(
              'text-[13px] font-semibold tracking-[0.12em] transition',
              captureMode === 'video' ? 'text-amber-400' : 'text-white/35 hover:text-white/55',
            )}
            onClick={() => {
              if (isRecording) finalizeRecording()
              setCaptureMode('video')
            }}
          >
            VIDEO
          </button>
          <button
            type="button"
            className={cn(
              'text-[13px] font-semibold tracking-[0.12em] transition',
              captureMode === 'photo' ? 'text-amber-400' : 'text-white/35 hover:text-white/55',
            )}
            onClick={() => {
              if (isRecording) finalizeRecording()
              setCaptureMode('photo')
            }}
          >
            PHOTO
          </button>
        </div>
      </div>
    </div>
  )
}
