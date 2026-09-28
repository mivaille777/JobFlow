export type ToastTone = 'success' | 'error' | 'info'

export interface ToastEventDetail {
  message: string
  tone: ToastTone
}

export const TOAST_EVENT = 'jobflow:toast'

export function showToast(message: string, tone: ToastTone = 'success'): void {
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT, {
      detail: { message, tone }
    })
  )
}
