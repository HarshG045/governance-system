import { createBrowserRouter } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { SubmitComplaint } from './pages/citizen/SubmitComplaint';
import { TrackComplaint } from './pages/citizen/TrackComplaint';
import { MyComplaints } from './pages/citizen/MyComplaints';
import { OfficialDashboard } from './pages/official/OfficialDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageUsers } from './pages/admin/ManageUsers';
import { Reports } from './pages/admin/Reports';
import { Departments } from './pages/admin/Departments';
import { NotificationsConfig } from './pages/admin/NotificationsConfig';
import { NotFound } from './pages/NotFound';
import { GenericPage } from './pages/GenericPage';
import { Unauthorized } from './pages/Unauthorized';

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },

  // Citizen routes
  {
    path: '/citizen',
    element: <AppLayout />,
    children: [
      { index: true, element: <CitizenDashboard /> },
      { path: 'submit', element: <SubmitComplaint /> },
      { path: 'edit/:id', element: <SubmitComplaint /> },
      { path: 'track', element: <TrackComplaint /> },
      { path: 'track/:id', element: <TrackComplaint /> },
      { path: 'complaints', element: <MyComplaints /> },
      { path: 'profile', element: <GenericPage title="My Profile" description="Update your personal information, contact details, and account settings." /> },
    ],
  },

  // Official routes
  {
    path: '/official',
    element: <AppLayout />,
    children: [
      { index: true, element: <OfficialDashboard /> },
      { path: 'complaints', element: <OfficialDashboard /> },
      { path: 'reports', element: <OfficialDashboard /> },
      { path: 'profile', element: <GenericPage title="Profile" description="Manage your official profile and department preferences." /> },
    ],
  },

  // Admin routes
  {
    path: '/admin',
    element: <AppLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <ManageUsers /> },
      { path: 'reports', element: <Reports /> },
      { path: 'notifications', element: <NotificationsConfig /> },
      { path: 'departments', element: <Departments /> },
    ],
  },

  { path: '/403', element: <Unauthorized /> },
  { path: '*', element: <NotFound /> },
]);
