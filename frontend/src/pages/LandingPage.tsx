import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex justify-center mb-16">
          <div className="bg-white rounded-lg shadow-lg border border-[var(--border-color)] p-12 max-w-2xl w-full text-center">
            <h1 className="mb-4">PCMC Governance Portal</h1>
            <p className="text-lg text-[var(--text-muted)] mb-8">
              Pimpri-Chinchwad Municipal Corporation - Citizen Services Platform
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="primary" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="secondary" onClick={() => navigate('/register')}>
                Register
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Citizens Registered"
            value="12,450"
            description="Active users on the platform"
            icon={<span className="text-2xl">👥</span>}
          />
          <StatCard
            title="Officers Serving"
            value="156"
            description="Municipal officers available"
            icon={<span className="text-2xl">👮</span>}
          />
          <StatCard
            title="System Administrators"
            value="8"
            description="Managing the platform"
            icon={<span className="text-2xl">⚙️</span>}
          />
        </div>
      </div>
    </div>
  );
}
