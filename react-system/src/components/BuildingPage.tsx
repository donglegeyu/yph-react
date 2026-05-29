export default function BuildingPage({ title }: { title?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'rgba(0,0,0,0.45)',
      fontSize: 16
    }}>
      {title ? `${title} - 建设中` : '页面建设中...'}
    </div>
  )
}
