import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from '../lib/auth';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

export default function App() {
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const show = () => setNetworkError(true);
    const hide = () => setNetworkError(false);
    window.addEventListener('api-network-error', show);
    window.addEventListener('api-network-ok', hide);
    return () => {
      window.removeEventListener('api-network-error', show);
      window.removeEventListener('api-network-ok', hide);
    };
  }, []);

  return (
    <AuthProvider>
      {networkError && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-red-600 text-white text-sm text-center py-2">
          Network error: API server is unreachable. Check the backend service and try again.
        </div>
      )}
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors duration={3000} />
    </AuthProvider>
  );
}
