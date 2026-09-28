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

  const toneClass =
    toast.tone === 'error'
      ? 'border-rose-200 bg-rose-600 text-white'
      : toast.tone === 'info'
        ? 'border-blue-200 bg-blue-600 text-white'
        : 'border-emerald-200 bg-emerald-600 text-white'

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[120]">
      <div
        key={toast.id}
        className={`jobflow-toast-in min-w-56 max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toneClass}`}
      >
        {toast.message}
      </div>
    </div>
  )
}
