export default function App(): JSX.Element {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-accent)' }}>
          Kang Paket API
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Titip request, balik bawa response.</p>
      </div>
    </div>
  )
}
