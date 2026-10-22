import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface UiStore {
  theme: Theme
  captureSheetOpen: boolean
  setTheme: (theme: Theme) => void
  openCaptureSheet: () => void
  closeCaptureSheet: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  theme: 'dark',
  captureSheetOpen: false,
  setTheme: (theme) => set({ theme }),
  openCaptureSheet: () => set({ captureSheetOpen: true }),
  closeCaptureSheet: () => set({ captureSheetOpen: false }),
}))