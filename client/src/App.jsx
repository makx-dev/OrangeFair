import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlateDetailPage from './pages/PlateDetailPage';
import FareSplitPage from './pages/FareSplitPage';
import HistoryPage from './pages/HistoryPage';
import SearchPage from './pages/SearchPage';
import LogRidePage from './pages/LogRidePage';
import ReportsPage from './pages/ReportsPage';
import ReportStatusPage from './pages/ReportStatusPage';
import RouteWatchPage from './pages/RouteWatchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LocalFarePage from './pages/LocalFarePage';

// We will add more pages later, map them to existing pages for now
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Protected Routes with AppLayout */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/home" element={<HomePage />} />
        <Route path="/auto/:plateNumber" element={<PlateDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/local-fare" element={<LocalFarePage />} />
        <Route path="/log-ride" element={<LogRidePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id/status" element={<ReportStatusPage />} />
        <Route path="/route-watch" element={<RouteWatchPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/fare-split" element={<FareSplitPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<div>Settings placeholder</div>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
