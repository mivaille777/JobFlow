import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { filterCommands } from '../app/commands'

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

    function openFromUi() {
      setOpen(true)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('jobflow:open-command-palette', openFromUi)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('jobflow:open-command-palette', openFromUi)
    }
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
      className="jobflow-fade-in fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/20 px-4 pt-[13vh] backdrop-blur-md"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="jobflow-dialog-in jobflow-command-palette w-full max-w-xl overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="jobflow-command-search">
          <Search size={17} className="shrink-0 text-muted" />
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
            placeholder="搜索页面、功能或命令…"
            className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm outline-none"
          />
          <kbd className="jobflow-kbd">Esc</kbd>
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
                  'jobflow-command-row',
                  index === activeIndex ? 'is-active' : ''
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{command.label}</div>
                  <div className="mt-0.5 truncate text-xs text-muted">{command.description}</div>
                </div>
                {command.shortcut && <kbd className="jobflow-kbd">{command.shortcut}</kbd>}
              </button>
            ))
          )}
        </div>

        <div className="jobflow-command-footer">
          <span>↑↓ 选择</span>
          <span>Enter 打开</span>
          <span>Ctrl N 新增岗位</span>
        </div>
      </div>
    </div>
  )
}
