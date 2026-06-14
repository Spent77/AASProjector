import type { ProjectorApi } from './index'

declare global {
  interface Window {
    projector: ProjectorApi
  }
}

export {}
