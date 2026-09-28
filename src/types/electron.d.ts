import type {
  ApplicationDetail,
  ApplicationEvent,
  ApplicationListItem,
  ApplicationPatch,
  CreateApplicationRequest
} from '../shared/application'
import type {
  CreateInterviewRequest,
  InterviewDetail,
  InterviewListItem,
  InterviewPatch
} from '../shared/interview'
import type { TodayDashboardData } from '../shared/today'

export {}

declare global {
  interface Window {
    jobflow: {
      app: {
        getVersion: () => Promise<string>
      }
      today: {
        get: () => Promise<TodayDashboardData>
      }
      applications: {
        list: () => Promise<ApplicationListItem[]>
        get: (id: string) => Promise<ApplicationDetail>
        events: (id: string) => Promise<ApplicationEvent[]>
        create: (input: CreateApplicationRequest) => Promise<ApplicationDetail>
        update: (id: string, patch: ApplicationPatch) => Promise<ApplicationDetail>
      }
      interviews: {
        list: () => Promise<InterviewListItem[]>
        get: (id: string) => Promise<InterviewDetail>
        create: (input: CreateInterviewRequest) => Promise<InterviewDetail>
        update: (id: string, patch: InterviewPatch) => Promise<InterviewDetail>
        delete: (id: string) => Promise<void>
      }
    }
  }
}
