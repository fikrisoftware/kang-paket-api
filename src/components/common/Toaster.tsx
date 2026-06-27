import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from '../../store/toastStore'

const STYLES: Record<ToastType, { color: string; icon: typeof Info }> = {
  success: { color: '#10b981', icon: CheckCircle2 },
  error: { color: '#ef4444', icon: XCircle },
  info: { color: '#3b82f6', icon: Info }
}

export function Toaster(): JSX.Element {
  const { toasts, dismiss } = useToastStore()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
        pointerEvents: 'none'
      }}
    >
      {toasts.map((t) => {
        const { color, icon: Icon } = STYLES[t.type]
        return (
          <div
            key={t.id}
            className="flex items-start gap-2.5 pl-3 pr-2 py-2.5 rounded-lg"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderLeft: `3px solid ${color}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              pointerEvents: 'auto'
            }}
          >
            <Icon size={16} style={{ color, flexShrink: 0, marginTop: 1 }} />
            <span className="text-xs leading-relaxed flex-1" style={{ color: 'var(--color-text)' }}>
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--color-border)] flex-shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
