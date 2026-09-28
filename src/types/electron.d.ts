import type {
  ApplicationDetail,
  ApplicationEvent,
  ApplicationListItem,
  ApplicationPatch,
  CreateApplicationRequest
} from '../shared/application'

export {}

declare global {
  interface Window {
    jobflow: {
      app: {
        getVersion: () => Promise<string>
      }
      applications: {
        list: () => Promise<ApplicationListItem[]>
        get: (id: string) => Promise<ApplicationDetail>
        events: (id: string) => Promise<ApplicationEvent[]>
        create: (input: CreateApplicationRequest) => Promise<ApplicationDetail>
        update: (id: string, patch: ApplicationPatch) => Promise<ApplicationDetail>
      }
    }
  }
}
