import { useNavigate } from 'react-router';
import { Badge } from './Badge';

interface TopbarProps {
  title: string;
  user?: {
    name: string;
    role: 'citizen' | 'officer' | 'admin';
  } | null;
  onLogout?: () => void;
  showLogin?: boolean;
}

export function Topbar({ title, user, onLogout, showLogin }: TopbarProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-white border-b border-[var(--border-color)] flex items-center justify-between px-6 z-10 h-[60px] ${
        user ? 'lg:left-60' : ''
      }`}
    >
      <h1 className="m-0 text-xl">{title}</h1>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user.name}</span>
              <Badge type="role" value={user.role} />
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-sm text-[var(--primary-blue)] hover:underline"
              >
                Logout
              </button>
            )}
          </>
        ) : showLogin ? (
          <button
            onClick={() => navigate('/login')}
            className="h-9 px-4 bg-[var(--primary-blue)] text-white rounded-md hover:bg-[var(--navy)] font-medium"
          >
            Login
          </button>
        ) : null}
      </div>
    </div>
  );
}
