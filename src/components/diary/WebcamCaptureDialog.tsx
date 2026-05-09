import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Camera, SwitchCamera } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'

type FacingMode = 'user' | 'environment'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (blob: Blob, mimeType: string) => void
}

export function WebcamCaptureDialog({ open, onOpenChange, onCapture }: Props) {
  const webcamRef = useRef<Webcam>(null)
  const [ready, setReady] = useState(false)
  const [facingMode, setFacingMode] = useState<FacingMode>('user')

  const capture = useCallback(() => {
    const shot = webcamRef.current?.getScreenshot()
    if (!shot) return
    fetch(shot)
      .then((r) => r.blob())
      .then((blob) => {
        onCapture(blob, blob.type || 'image/jpeg')
        onOpenChange(false)
      })
      .catch(() => {})
  }, [onCapture, onOpenChange])

  const flipCamera = useCallback(() => {
    setReady(false)
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-5 text-[var(--theme-primary)]" aria-hidden />
            Camera snapshot
          </DialogTitle>
          <DialogDescription>
            Grant camera access if prompted. Snapshots are saved locally with your story entry.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-lg border border-[var(--theme-border-strong)] bg-black">
          <Webcam
            key={facingMode}
            ref={webcamRef}
            audio={false}
            mirrored={facingMode === 'user'}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.93}
            forceScreenshotSourceSize
            imageSmoothing
            disablePictureInPicture
            videoConstraints={{ facingMode }}
            onUserMedia={() => setReady(true)}
            onUserMediaError={() => setReady(false)}
            className="aspect-video w-full object-cover"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-10 rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm hover:bg-black/70"
              aria-label={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
              onClick={flipCamera}
            >
              <SwitchCamera className="size-5" aria-hidden />
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" disabled={!ready} onClick={capture}>
            Capture photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
