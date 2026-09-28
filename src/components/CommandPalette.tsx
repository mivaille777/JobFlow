import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appCommands, filterCommands } from '../app/commands'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

export function CommandPalette() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const commands = useMemo(() => filterCommands(query), [query])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const ctrlOrMeta = event.ctrlKey || event.metaKey

      if (ctrlOrMeta && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
        return
      }

      if (ctrlOrMeta && event.key.toLocaleLowerCase() === 'n') {
        event.preventDefault()
        setOpen(false)
        navigate('/applications?new=1')
        return
      }

      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault()
        setOpen(false)
        navigate('/applications?focus=search')
        return
      }

      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, open])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function execute(path: string) {
    setOpen(false)
    navigate(path)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/35 px-4 pt-[14vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-line p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActiveIndex((index) =>
                  commands.length === 0 ? 0 : (index + 1) % commands.length
                )
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActiveIndex((index) =>
                  commands.length === 0
                    ? 0
                    : (index - 1 + commands.length) % commands.length
                )
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                const command = commands[activeIndex]
                if (command) execute(command.path)
              }
            }}
            placeholder="输入命令、页面或功能…"
            className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {commands.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted">没有匹配的命令</div>
          ) : (
            commands.map((command, index) => (
              <button
                key={command.id}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => execute(command.path)}
                className={[
                  'flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition',
                  index === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{command.label}</div>
                  <div className="mt-0.5 truncate text-xs text-muted">{command.description}</div>
                </div>
                {command.shortcut && (
                  <kbd className="shrink-0 rounded-md border border-line bg-white px-2 py-1 text-[10px] text-muted">
                    {command.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-4 border-t border-line px-4 py-2 text-[10px] text-muted">
          <span>↑↓ 选择</span>
          <span>Enter 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  )
}
