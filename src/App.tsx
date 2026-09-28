import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { navigationItems } from './app/navigation'
import { applyThemePreference } from './app/theme'
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

export default function App() {
  useEffect(() => {
    void window.jobflow.settings
      .get()
      .then((settings) => applyThemePreference(settings.theme))
      .catch(() => applyThemePreference('system'))
  }, [])

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="grid min-h-screen grid-cols-[220px_1fr]">
        <aside className="border-r border-line bg-white px-4 py-5">
          <div className="mb-8 px-2">
            <div className="text-xl font-semibold tracking-tight">JobFlow</div>
            <div className="mt-1 text-xs text-muted">Campus recruiting pipeline</div>
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-slate-100 font-medium text-ink'
                      : 'text-muted hover:bg-slate-50 hover:text-ink'
                  ].join(' ')
                }
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-slate-400">{item.shortLabel}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-8 py-7">
          <Routes>
            {navigationItems.map((item) => {
              const Page = pageByPath[item.path]
              return <Route key={item.path} path={item.path} element={<Page />} />
            })}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
