interface SectionTitleProps {
  title: string
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 38,
        padding: '8px 0',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 4,
          height: 16,
          borderRadius: 12,
          background: '#F95914',
        }}
      />
      <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.88)' }}>{title}</span>
    </div>
  )
}
