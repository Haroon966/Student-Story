import { AppShell } from '@/components/layout/AppShell'
import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const DownloadCenterPage = lazy(() =>
  import('@/pages/DownloadCenterPage').then((m) => ({ default: m.DownloadCenterPage })),
)
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const StudentPage = lazy(() => import('@/pages/StudentPage').then((m) => ({ default: m.StudentPage })))
const StudentCameraPage = lazy(() =>
  import('@/pages/StudentCameraPage').then((m) => ({ default: m.StudentCameraPage })),
)
const StudentProfilePage = lazy(() =>
  import('@/pages/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })),
)
const StudentAiPage = lazy(() => import('@/pages/StudentAiPage').then((m) => ({ default: m.StudentAiPage })))

function routerBasename(): string | undefined {
  const urlBase = import.meta.env.BASE_URL
  if (urlBase === '/') return undefined
  return urlBase.replace(/\/+$/, '')
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="downloads" element={<DownloadCenterPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="student/:id" element={<StudentPage />} />
          <Route path="student/:id/camera" element={<StudentCameraPage />} />
          <Route path="student/:id/profile" element={<StudentProfilePage />} />
          <Route path="student/:id/ai" element={<StudentAiPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
