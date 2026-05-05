import { fetchApi } from './client';

export async function getAll(filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  if (filters.role) queryParams.append('role', filters.role);
  if (filters.status) queryParams.append('status', filters.status);

  return fetchApi(`/users?${queryParams.toString()}`);
}

export async function getById(id: string) {
  return fetchApi(`/users/${id}`);
}

export async function create(userData: any) {
  return fetchApi('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function update(id: string, updates: any) {
  return fetchApi(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function remove(id: string) {
  return fetchApi(`/users/${id}`, {
    method: 'DELETE',
  });
}
