import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { authService } from '@/services/api';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await authService.register(name, email, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg border border-[var(--border-color)] p-8 max-w-md w-full">
        <h2 className="mb-6 text-center">Register as Citizen</h2>

        {success && (
          <Banner
            type="success"
            message="Registration successful! Redirecting to login..."
            className="mb-4"
          />
        )}
        
        {error && <Banner type="error" message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            disabled={isLoading || success}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={isLoading || success}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            disabled={isLoading || success}
          />

          <Button type="submit" className="w-full" disabled={isLoading || success}>
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-[var(--text-muted)]">Already have an account? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-[var(--primary-blue)] hover:underline"
            type="button"
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}
