export const applicationStatuses = [
  '待投递',
  '已投递',
  '测评/笔试',
  '面试中',
  'Offer阶段',
  '已结束',
  '暂停'
] as const

export const applicationPriorities = ['S', 'A', 'B', 'C'] as const
export const applicationRecruitmentTypes = ['校招', '实习'] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]
export type ApplicationPriority = (typeof applicationPriorities)[number]
export type ApplicationRecruitmentType = (typeof applicationRecruitmentTypes)[number]

export interface ApplicationListItem {
  id: string
  companyId: string
  companyName: string
  jobTitle: string
  direction: string | null
  recruitmentType: string
  location: string | null
  priority: string
  status: string
  stage: string | null
  channel: string | null
  nextAction: string | null
  nextActionDate: string | null
  applicationDate: string | null
  lastProgressAt: string | null
  updatedAt: string
}

export interface ApplicationDetail extends ApplicationListItem {
  jobUrl: string | null
  jobId: string | null
  referral: string | null
  resumeVersion: string | null
  finalResult: string | null
  notes: string | null
  createdAt: string
}

export interface ApplicationEvent {
  id: string
  applicationId: string
  eventType: string
  oldValue: string | null
  newValue: string | null
  title: string
  description: string | null
  createdAt: string
}

export interface CreateApplicationRequest {
  companyName: string
  jobTitle: string
  direction?: string | null
  recruitmentType?: string
  location?: string | null
  priority?: string
  status?: string
  jobUrl?: string | null
  jobId?: string | null
  channel?: string | null
  referral?: string | null
  resumeVersion?: string | null
  applicationDate?: string | null
  notes?: string | null
}

export interface ApplicationPatch {
  priority?: string
  status?: string
  stage?: string | null
  nextAction?: string | null
  nextActionDate?: string | null
  direction?: string | null
  recruitmentType?: string
  location?: string | null
  jobUrl?: string | null
  jobId?: string | null
  channel?: string | null
  referral?: string | null
  resumeVersion?: string | null
  applicationDate?: string | null
  finalResult?: string | null
  notes?: string | null
}
