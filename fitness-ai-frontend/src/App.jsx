// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import PtWorkspace from './pages/PtWorkspace';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
          <Routes>
            {/* Trang Onboarding (Khám phá hoặc Khảo sát thể trạng ban đầu) */}
            <Route path="/" element={<Onboarding />} />

            {/* Trang Dashboard Học Viên (Hỗ trợ cả Học viên đã đăng nhập & Khách xem phác đồ AI) */}
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

            {/* Trang Admin Quản Lý Gym: Chỉ DUY NHẤT 1 Admin truy cập */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}