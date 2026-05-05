import { fetchApi } from './client';

export async function getAll(filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.userId) queryParams.append('userId', filters.userId);

  return fetchApi(`/complaints?${queryParams.toString()}`);
}

export async function getById(id: string) {
  return fetchApi(`/complaints/${id}`);
}

export async function create(complaintData: any) {
  return fetchApi('/complaints', {
    method: 'POST',
    body: JSON.stringify(complaintData),
  });
}

export async function update(id: string, updates: any) {
  return fetchApi(`/complaints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function remove(id: string) {
  return fetchApi(`/complaints/${id}`, {
    method: 'DELETE',
  });
}
