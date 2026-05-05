import { useState } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router';
import {
  LayoutDashboard, Search, Bell, User, LogOut,
  ClipboardList, CheckSquare, RefreshCw, XCircle, MessageSquare,
  Info, BarChart2, Users, Shield, Download, Settings,
  Building2, Menu, X, ChevronDown, FilePlus,
} from 'lucide-react';
import { useAuth, type UserRole } from '../../../lib/auth';
import { notificationsApi } from '../../../lib/api';
import { useEffect } from 'react';
import type { NotificationItem } from '../../../lib/types';
import { toast } from 'sonner';

const citizenMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/citizen' },
  { icon: FilePlus, label: 'Submit Complaint', path: '/citizen/submit' },
  { icon: ClipboardList, label: 'My Complaints', path: '/citizen/complaints' },
  { icon: Search, label: 'Track Complaint', path: '/citizen/track' },
  { icon: User, label: 'My Profile', path: '/citizen/profile' },
];

const officialMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/official' },
  { icon: ClipboardList, label: 'Complaints', path: '/official/complaints', badge: 12 },
  { icon: BarChart2, label: 'Reports', path: '/official/reports' },
  { icon: User, label: 'Profile', path: '/official/profile' },
];

const adminMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Manage Users', path: '/admin/users' },
  { icon: BarChart2, label: 'System Reports', path: '/admin/reports' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  { icon: Building2, label: 'Departments', path: '/admin/departments' },
];

const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string; menu: typeof citizenMenu }> = {
  citizen: { label: 'CITIZEN', color: 'text-blue-700', bgColor: 'bg-blue-100', menu: citizenMenu },
  official: { label: 'OFFICIAL', color: 'text-teal-700', bgColor: 'bg-teal-100', menu: officialMenu },
  admin: { label: 'ADMIN', color: 'text-red-700', bgColor: 'bg-red-100', menu: adminMenu },
};

export function AppLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (!loading && user) {
      const section = location.pathname.split('/')[1];
      if (['citizen', 'official', 'admin'].includes(section) && section !== user.role) {
        navigate('/403');
      }
    }
  }, [user, loading, navigate, location.pathname]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const role = user?.role ?? 'citizen';
  const cfg = roleConfig[role as UserRole] || roleConfig.citizen;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      notificationsApi.getUserNotifications().then(notifs => {
        setNotifications(notifs as any[]);
        setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
      }).catch(() => {
        toast.error('Unable to load notifications');
      });
    }
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGlobalSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;

    if (role === 'admin') navigate(`/admin/users?q=${encodeURIComponent(query)}`);
    if (role === 'official') navigate(`/official?search=${encodeURIComponent(query)}`);
    if (role === 'citizen') navigate(`/citizen/complaints?q=${encodeURIComponent(query)}`);
    setGlobalSearch('');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Notifications marked as read');
    } catch (error: any) {
      toast.error(error.message || 'Unable to mark notifications as read');
    }
  };

  const handleClearNotifications = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch (error: any) {
      toast.error(error.message || 'Unable to clear notifications');
    }
  };

  const handleProfileNavigate = () => {
    setProfileOpen(false);
    navigate(`/${role}/profile`);
  };

  const handleSettingsNavigate = () => {
    setProfileOpen(false);
    navigate(role === 'admin' ? '/admin/notifications' : `/${role}/profile`);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-[#1A56DB] rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">Complaint Portal</span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-3">
          {cfg.menu.map((item) => {
            const Icon = item.icon;
            // Dashboard roots should use 'end' to avoid highlighting when on sub-pages
            const isRoot = ['/citizen', '/official', '/admin'].includes(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={isRoot}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative ${
                  isActive
                    ? 'bg-blue-50 text-[#1A56DB] font-medium border-r-2 border-[#1A56DB]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                )}
                {sidebarOpen && 'badge' in item && item.badge && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-2.5 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 hidden sm:block">Complaint Portal</span>
          </div>

          {/* Search */}
          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-sm mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search complaints, IDs..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <span className="font-medium text-gray-900 text-sm">Notifications</span>
                      <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-3 flex items-start gap-3 hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(n.created_at || '').toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="p-6 text-center text-xs text-gray-500">No notifications</div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button onClick={handleClearNotifications} className="text-xs text-red-500 hover:underline">Clear all</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Role chip */}
            <span className={`hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-semibold ${cfg.bgColor} ${cfg.color}`}>
              {cfg.label}
            </span>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <div className="w-7 h-7 rounded-full bg-[#1A56DB] flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500 hidden sm:block" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-20 py-1">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button onClick={handleProfileNavigate} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Profile
                    </button>
                    <button onClick={handleSettingsNavigate} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
