/**
 * Toast 管理器
 */

import { IRenderAPI } from 'keyerext'

export interface ToastItem {
  id: string
  icon: 'info' | 'success' | 'error' | 'warning'
  message: string
  duration?: number
}

class ToastManager {
  private listeners: Set<(toasts: ToastItem[]) => void> = new Set()
  private toasts: ToastItem[] = []

  subscribe(listener: (toasts: ToastItem[]) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  show(icon: 'info' | 'success' | 'error' | 'warning', message: string, duration = 3000) {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: ToastItem = { id, icon, message, duration }
    
    this.toasts.push(toast)
    this.notify()

    return id
  }

  close(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id)
    this.notify()
  }

  clear() {
    this.toasts = []
    this.notify()
  }
}

export const toastManager = new ToastManager()

export const toastImpl: IRenderAPI['toast'] = {
  async show(icon: 'info' | 'success' | 'error' | 'warning', message: string, duration?: number): Promise<void> {
    console.log("toast")
    toastManager.show(icon, message, duration)
  }
}
