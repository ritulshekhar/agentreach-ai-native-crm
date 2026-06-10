export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 28,
      flexWrap: 'wrap',
      gap: 16
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
