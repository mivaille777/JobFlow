export function applicationStatusClass(status: string): string {
  if (status === '待投递' || status === '暂停') return 'bg-slate-100 text-slate-600'
  if (status === '已投递') return 'bg-blue-50 text-blue-700'
  if (status === '测评/笔试') return 'bg-amber-50 text-amber-700'
  if (status === '面试中') return 'bg-violet-50 text-violet-700'
  if (status === 'Offer阶段') return 'bg-emerald-50 text-emerald-700'
  if (status === '已结束') return 'bg-rose-50 text-rose-700'
  return 'bg-slate-100 text-slate-600'
}

export function applicationPriorityClass(priority: string): string {
  if (priority === 'S') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
  if (priority === 'A') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
  if (priority === 'B') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}
