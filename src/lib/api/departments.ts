import { fetchApi } from './client';

export async function getAll() {
  return fetchApi('/departments');
}

export async function getById(id: string) {
  return fetchApi(`/departments/${id}`);
}

export async function create(departmentData: any) {
  return fetchApi('/departments', {
    method: 'POST',
    body: JSON.stringify(departmentData),
  });
}

export async function update(id: string, updates: any) {
  return fetchApi(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function remove(id: string) {
  return fetchApi(`/departments/${id}`, {
    method: 'DELETE',
  });
}
