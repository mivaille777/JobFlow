import type { ApplicationListItem, ApplicationPatch } from '../shared/application'

export {}

declare global {
  interface Window {
    jobflow: {
      app: {
        getVersion: () => Promise<string>
      }
      applications: {
        list: () => Promise<ApplicationListItem[]>
        update: (id: string, patch: ApplicationPatch) => Promise<ApplicationListItem>
      }
    }
  }
}
