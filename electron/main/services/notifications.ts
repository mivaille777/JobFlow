import { Notification } from 'electron'
import { buildDesktopNotificationPlans } from '../../../src/shared/notifications'
import { getAppDatabase } from '../db'
import { ApplicationRepository, InterviewRepository } from '../db/repositories'

const MAX_TIMEOUT_MS = 2_147_483_647

export class DesktopNotificationScheduler {
  private readonly timers = new Map<string, NodeJS.Timeout>()

  refresh(now = new Date()): number {
    this.stop()

    const db = getAppDatabase().db
    const applications = new ApplicationRepository(db).listWithCompany()
    const interviews = new InterviewRepository(db).listWithApplication()
    const plans = buildDesktopNotificationPlans(applications, interviews, now)

    if (!Notification.isSupported()) return 0

    for (const plan of plans) {
      const delay = Math.max(0, new Date(plan.fireAt).getTime() - Date.now())
      if (delay > MAX_TIMEOUT_MS) continue

      const timer = setTimeout(() => {
        this.timers.delete(plan.id)
        new Notification({
          title: plan.title,
          body: plan.body,
          silent: false
        }).show()
      }, delay)

      this.timers.set(plan.id, timer)
    }

    return this.timers.size
  }

  stop(): void {
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
  }
}

export const desktopNotificationScheduler = new DesktopNotificationScheduler()
