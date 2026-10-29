// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import LoadingFallback from './components/LoadingFallback';

// Code-splitting via React.lazy
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PtWorkspace = lazy(() => import('./pages/PtWorkspace'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
          <Suspense fallback={<LoadingFallback message="Đang khởi tạo hệ thống Fitness AI..." />}>
            <Routes>
              {/* Trang Onboarding (Khám phá hoặc Khảo sát thể trạng ban đầu) */}
              <Route path="/" element={<Onboarding />} />

              {/* Trang Dashboard Học Viên */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['member', 'admin', 'pt']} allowGuest={true}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Trang Huấn Luyện Viên: Chỉ PT truy cập */}
              <Route
                path="/pt"
                element={
                  <ProtectedRoute allowedRoles={['pt']}>
                    <PtWorkspace />
                  </ProtectedRoute>
                }
              />

              {/* Trang Admin Quản Lý Gym */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
