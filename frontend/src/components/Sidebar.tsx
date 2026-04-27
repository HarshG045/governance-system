import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

interface SidebarProps {
  userRole: 'citizen' | 'officer' | 'admin' | null;
}

export function Sidebar({ userRole }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!userRole) return null;

  const navigation = {
    citizen: [
      { id: '/citizen-dashboard', label: 'My Dashboard', icon: '🏠' },
      { id: '/submit-complaint', label: 'Submit Complaint', icon: '📝' },
      { id: '/track-complaint', label: 'Track Complaints', icon: '🔍' }
    ],
    officer: [
      { id: '/officer-dashboard', label: 'Dashboard', icon: '🏠' },
      { id: '/complaint-management', label: 'Manage Complaints', icon: '📋' }
    ],
    admin: [
      { id: '/admin-dashboard', label: 'Dashboard', icon: '🏠' },
      { id: '/user-management', label: 'User Management', icon: '👥' },
      { id: '/department-management', label: 'Departments', icon: '🏢' }
    ]
  };

  const links = navigation[userRole] || [];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--sidebar-bg)] text-white rounded-md"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 bottom-0 bg-[var(--sidebar-bg)] text-white flex flex-col z-40 transition-transform lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '240px' }}
      >
        <div className="px-6 py-5 border-b border-[var(--sidebar-border)]">
          <h2 className="m-0 text-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            PCMC Governance
          </h2>
        </div>

        <nav className="flex-1 px-3 py-4">
          {links.map(link => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-md text-left transition-colors
                ${location.pathname === link.id
                  ? 'bg-[var(--primary-blue)] text-white'
                  : 'text-gray-300 hover:bg-[var(--sidebar-accent)] hover:text-white'
                }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm font-medium">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-[var(--sidebar-border)] text-xs text-gray-500">
          v1.0.0
        </div>
      </div>
    </>
  );
}
