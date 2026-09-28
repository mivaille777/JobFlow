export interface AppCommand {
  id: string
  label: string
  description: string
  path: string
  shortcut?: string
  keywords: string[]
}

export const appCommands: AppCommand[] = [
  {
    id: 'new-application',
    label: '新增岗位',
    description: '快速记录一个新的求职岗位',
    path: '/applications?new=1',
    shortcut: 'Ctrl+N',
    keywords: ['new', 'application', '新增', '岗位', '投递']
  },
  {
    id: 'today',
    label: '今日',
    description: '查看今天的待办、逾期和面试',
    path: '/',
    keywords: ['today', '今日', '待办']
  },
  {
    id: 'applications',
    label: '投递管理',
    description: '打开岗位列表和 Kanban',
    path: '/applications',
    keywords: ['applications', '投递', '岗位', 'kanban']
  },
  {
    id: 'search-applications',
    label: '搜索岗位',
    description: '进入投递页并聚焦搜索框',
    path: '/applications?focus=search',
    shortcut: '/',
    keywords: ['search', '搜索', '公司', '岗位']
  },
  {
    id: 'interviews',
    label: '面试中心',
    description: '查看 Upcoming 和面试复盘',
    path: '/interviews',
    keywords: ['interviews', '面试', '复盘']
  },
  {
    id: 'analytics',
    label: '求职数据',
    description: '查看 Funnel、方向和渠道统计',
    path: '/analytics',
    keywords: ['analytics', '数据', '统计', 'funnel']
  },
  {
    id: 'settings',
    label: '设置',
    description: '外观、偏好、Excel 和本地备份',
    path: '/settings',
    keywords: ['settings', '设置', '备份', 'theme']
  }
]

export function filterCommands(query: string): AppCommand[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return appCommands

  return appCommands.filter((command) =>
    [command.label, command.description, ...command.keywords]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalized)
  )
}
