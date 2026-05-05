const BASE_URL = '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    window.dispatchEvent(new CustomEvent('api-network-ok'));
  } catch {
    window.dispatchEvent(new CustomEvent('api-network-error'));
    throw new Error('Network error. Check that the API server is running.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }

  if (response.status === 204) return null;
  return response.json();
}
