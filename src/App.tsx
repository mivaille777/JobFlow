import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { navigationItems } from './app/navigation'
import { applyThemePreference } from './app/theme'
import {
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CommandIcon,
  DashboardIcon,
  SettingsIcon
} from './components/Icons'
import { CommandPalette } from './components/CommandPalette'
import { ToastViewport } from './components/ToastViewport'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { InterviewsPage } from './pages/InterviewsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TodayPage } from './pages/TodayPage'

const pageByPath = {
  '/': TodayPage,
  '/applications': ApplicationsPage,
  '/interviews': InterviewsPage,
  '/analytics': AnalyticsPage,
  '/settings': SettingsPage
} as const

const iconByPath = {
  '/': DashboardIcon,
  '/applications': BriefcaseIcon,
  '/interviews': CalendarIcon,
  '/analytics': ChartIcon,
  '/settings': SettingsIcon
} as const

export default function App() {
  useEffect(() => {
    void window.jobflow.settings
      .get()
      .then((settings) => applyThemePreference(settings.theme))
      .catch(() => applyThemePreference('system'))
  }, [])

  return (
    <div className="jobflow-app min-h-screen text-ink">
      <div className="jobflow-windowbar" aria-hidden="true">
        <div className="jobflow-windowbar-brand">
          <span className="jobflow-windowbar-mark">J</span>
          <span>JobFlow</span>
        </div>
      </div>

      <div className="jobflow-workspace">
        <aside className="jobflow-sidebar">
          <div className="jobflow-brand">
            <div className="jobflow-brand-icon">
              <BriefcaseIcon size={17} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">JobFlow</div>
              <div className="mt-0.5 truncate text-[11px] text-muted">Recruiting workspace</div>
            </div>
          </div>

          <nav className="jobflow-nav" aria-label="主导航">
            <div className="jobflow-nav-label">Workspace</div>
            {navigationItems.map((item) => {
              const Icon = iconByPath[item.path]
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    ['jobflow-nav-item', isActive ? 'is-active' : ''].filter(Boolean).join(' ')
                  }
                >
                  <Icon size={16} strokeWidth={1.9} />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="jobflow-nav-short">{item.shortLabel}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="jobflow-sidebar-footer">
            <button
              type="button"
              className="jobflow-command-hint"
              onClick={() => window.dispatchEvent(new CustomEvent('jobflow:open-command-palette'))}
            >
              <CommandIcon size={14} />
              <span>快速操作</span>
              <kbd>Ctrl K</kbd>
            </button>
          </div>
        </aside>

        <main className="jobflow-content">
          <Routes>
            {navigationItems.map((item) => {
              const Page = pageByPath[item.path]
              return <Route key={item.path} path={item.path} element={<Page />} />
            })}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <CommandPalette />
      <ToastViewport />
    </div>
  )
}
