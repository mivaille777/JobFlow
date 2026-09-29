import { CircleCheck, CircleX, Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  TOAST_EVENT,
  type ToastEventDetail,
  type ToastTone
} from '../app/toast'

interface ToastState {
  id: number
  message: string
  tone: ToastTone
}

export function ToastViewport() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const sequence = useRef(0)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastEventDetail>).detail
      if (!detail?.message) return

      sequence.current += 1
      setToast({
        id: sequence.current,
        message: detail.message,
        tone: detail.tone
      })

      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setToast(null), 2_000)
    }

    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!toast) return null

  const Icon = toast.tone === 'error' ? CircleX : toast.tone === 'info' ? Info : CircleCheck

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[120]">
      <div key={toast.id} className="jobflow-toast-in jobflow-toast">
        <Icon size={16} />
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
