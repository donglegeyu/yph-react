import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '@/store/app'
import FirstSidebar from './FirstSidebar'
import SecondSidebar from './SecondSidebar'
import TabBar from './TabBar'

export default function MainLayout() {
  const fetchMenus = useAppStore((s) => s.fetchMenus)

  useEffect(() => {
    fetchMenus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#F5F5F5',
      }}
    >
      <FirstSidebar />
      <SecondSidebar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#F5F5F5',
          minWidth: 0,
        }}
      >
        <TabBar />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
