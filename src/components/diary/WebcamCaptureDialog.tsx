import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Camera } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (blob: Blob, mimeType: string) => void
}

export function WebcamCaptureDialog({ open, onOpenChange, onCapture }: Props) {
  const webcamRef = useRef<Webcam>(null)
  const [ready, setReady] = useState(false)

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

        <div className="overflow-hidden rounded-lg border border-[var(--theme-border-strong)] bg-black">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user' }}
            onUserMedia={() => setReady(true)}
            onUserMediaError={() => setReady(false)}
            className="aspect-video w-full object-cover"
          />
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
