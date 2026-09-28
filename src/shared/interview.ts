export const interviewRounds = [
  '一面',
  '二面',
  '三面/主管面',
  'HR面',
  '加面',
  '其他'
] as const

export const interviewFormats = ['线上视频', '电话', '线下面试', '群面', '其他'] as const
export const interviewResults = ['待面', '等结果', '通过', '未通过', '取消/改期'] as const

export interface InterviewListItem {
  id: string
  applicationId: string
  companyName: string
  jobTitle: string
  round: string
  scheduledAt: string
  format: string | null
  interviewer: string | null
  department: string | null
  durationMinutes: number | null
  result: string | null
  selfRating: number | null
  createdAt: string
  updatedAt: string
}

export interface InterviewDetail extends InterviewListItem {
  mainQuestions: string | null
  codingQuestions: string | null
  projectQuestions: string | null
  improvements: string | null
  nextRoundFocus: string | null
}

export interface CreateInterviewRequest {
  applicationId: string
  round: string
  scheduledAt: string
  format?: string | null
  interviewer?: string | null
  department?: string | null
  durationMinutes?: number | null
  result?: string | null
}

export interface InterviewPatch {
  round?: string
  scheduledAt?: string
  format?: string | null
  interviewer?: string | null
  department?: string | null
  durationMinutes?: number | null
  result?: string | null
  mainQuestions?: string | null
  codingQuestions?: string | null
  projectQuestions?: string | null
  selfRating?: number | null
  improvements?: string | null
  nextRoundFocus?: string | null
}
