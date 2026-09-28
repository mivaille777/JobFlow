export const navigationItems = [
  { label: '今日', path: '/', shortLabel: 'Today' },
  { label: '投递', path: '/applications', shortLabel: 'Applications' },
  { label: '面试', path: '/interviews', shortLabel: 'Interviews' },
  { label: '数据', path: '/analytics', shortLabel: 'Analytics' },
  { label: '设置', path: '/settings', shortLabel: 'Settings' }
] as const

export type NavigationPath = (typeof navigationItems)[number]['path']
