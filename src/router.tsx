import { Route, Routes } from 'react-router-dom'
import {
  HomeRoute,
  NewMatchRoute,
  ScoreRoute,
  SettingsRoute,
  ViewRoute,
} from './routes'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/match/new" element={<NewMatchRoute />} />
      <Route path="/match/:matchId/score" element={<ScoreRoute />} />
      <Route path="/match/:matchId/view" element={<ViewRoute />} />
      <Route path="/settings" element={<SettingsRoute />} />
      <Route path="*" element={<HomeRoute />} />
    </Routes>
  )
}