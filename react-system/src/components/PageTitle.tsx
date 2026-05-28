interface PageTitleProps {
  title: string
  description?: string
}

export default function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
      {description && <p style={{ margin: '4px 0 0', fontSize: 14, color: '#999' }}>{description}</p>}
    </div>
  )
}
