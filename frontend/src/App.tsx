import { Routes, Route, useLocation, Navigate } from 'react-router';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { ComplaintManagementPage } from './pages/ComplaintManagementPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserManagementPage } from './pages/UserManagementPage';
import { DepartmentManagementPage } from './pages/DepartmentManagementPage';
import { useAuth, ProtectedRoute } from './contexts/AuthContext';

export default function App() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/': 'PCMC Governance Portal',
      '/login': 'Login',
      '/register': 'Register',
      '/citizen-dashboard': 'Citizen Dashboard',
      '/submit-complaint': 'Submit Complaint',
      '/track-complaint': 'Track Complaints',
      '/officer-dashboard': 'Officer Dashboard',
      '/complaint-management': 'Complaint Management',
      '/admin-dashboard': 'Admin Dashboard',
      '/user-management': 'User Management',
      '/department-management': 'Department Management'
    };
    return titles[path] || 'PCMC Governance';
  };

  const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {!isAuthPage && user && (
        <Sidebar userRole={user.role} />
      )}

      <Topbar
        title={getPageTitle()}
        user={user}
        onLogout={logout}
        showLogin={location.pathname === '/'}
      />

      <div
        className="min-h-screen"
        style={{
          marginLeft: !isAuthPage && user ? '0' : '0',
          paddingTop: '60px'
        }}
      >
        <div className={!isAuthPage && user ? 'lg:ml-60' : ''}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Citizen Routes */}
            <Route path="/citizen-dashboard" element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/submit-complaint" element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <SubmitComplaintPage />
              </ProtectedRoute>
            } />
            <Route path="/track-complaint" element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <TrackComplaintPage />
              </ProtectedRoute>
            } />

            {/* Officer Routes */}
            <Route path="/officer-dashboard" element={
              <ProtectedRoute allowedRoles={['officer']}>
                <OfficerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/complaint-management" element={
              <ProtectedRoute allowedRoles={['officer']}>
                <ComplaintManagementPage />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/user-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/department-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DepartmentManagementPage />
              </ProtectedRoute>
            } />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
