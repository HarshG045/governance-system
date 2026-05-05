import { useNavigate } from 'react-router';
import { ShieldAlert, Home } from 'lucide-react';

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-gray-900 text-2xl font-semibold mb-2">Access denied</h1>
        <p className="text-sm text-gray-500 mb-6">Your account does not have permission to open this section.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A56DB] text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Home className="w-4 h-4" /> Go Home
        </button>
      </div>
    </div>
  );
}
