import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { applicationPriorityClass } from '../../app/presentation'
import type { ApplicationListItem } from '../../shared/application'
import { groupApplicationsByKanbanColumn, kanbanColumns } from './kanban'

interface KanbanBoardProps {
  items: ApplicationListItem[]
  onOpen: (id: string) => void
  onStatusChange: (id: string, status: string) => Promise<void>
}

function formatDeadline(value: string | null): string {
  if (!value) return '无截止'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date)
}

function ApplicationCard({
  item,
  onOpen,
  overlay = false
}: {
  item: ApplicationListItem
  onOpen?: (id: string) => void
  overlay?: boolean
}) {
  const draggable = useDraggable({
    id: item.id,
    disabled: overlay,
    data: { status: item.status }
  })

  const transform = draggable.transform
  const style: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  return (
    <article
      ref={draggable.setNodeRef}
      style={style}
      {...draggable.listeners}
      {...draggable.attributes}
      onClick={() => onOpen?.(item.id)}
      className={[
        'rounded-xl border border-line bg-white p-3.5 text-left shadow-sm transition duration-150 ease-out',
        overlay ? 'rotate-1 shadow-xl' : 'cursor-grab hover:border-slate-300 hover:shadow-md',
        draggable.isDragging ? 'opacity-30' : ''
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{item.companyName}</div>
          <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{item.jobTitle}</div>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${applicationPriorityClass(item.priority)}`}>
          {item.priority}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        <span className="truncate text-[11px] text-slate-500">{item.stage ?? '未设置节点'}</span>
        <span className="shrink-0 text-[11px] text-slate-400">
          {formatDeadline(item.nextActionDate)}
        </span>
      </div>
    </article>
  )
}

function KanbanColumn({
  status,
  label,
  items,
  onOpen
}: {
  status: string
  label: string
  items: ApplicationListItem[]
  onOpen: (id: string) => void
}) {
  const droppable = useDroppable({ id: `lane:${status}` })

  return (
    <section className="w-[270px] shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted">
          {items.length}
        </span>
      </div>
      <div
        ref={droppable.setNodeRef}
        aria-label={`${label} 看板列`}
        className={[
          'min-h-[420px] space-y-2.5 rounded-xl border border-line bg-slate-50/80 p-2.5 transition-colors duration-150 ease-out',
          droppable.isOver ? 'border-blue-300 bg-blue-50/60' : ''
        ].join(' ')}
      >
        {items.map((item) => (
          <ApplicationCard key={item.id} item={item} onOpen={onOpen} />
        ))}
        {items.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
            拖到这里
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function KanbanBoard({ items, onOpen, onStatusChange }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )
  const grouped = useMemo(() => groupApplicationsByKanbanColumn(items), [items])
  const [activeId, setActiveId] = useState<string | null>(null)
  const suppressOpenId = useRef<string | null>(null)
  const activeItem = items.find((item) => item.id === activeId) ?? null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const draggedId = String(event.active.id)
    suppressOpenId.current = draggedId
    window.setTimeout(() => {
      if (suppressOpenId.current === draggedId) suppressOpenId.current = null
    }, 750)

    setActiveId(null)
    const overId = event.over?.id
    if (!overId || typeof overId !== 'string' || !overId.startsWith('lane:')) return

    const status = overId.slice('lane:'.length)
    const item = items.find((candidate) => candidate.id === draggedId)
    if (!item || item.status === status) return

    void onStatusChange(item.id, status)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max gap-4">
          {kanbanColumns.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              label={column.label}
              items={grouped[column.status]}
              onOpen={(id) => {
                if (suppressOpenId.current === id) return
                onOpen(id)
              }}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeItem ? <ApplicationCard item={activeItem} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
