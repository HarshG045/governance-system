import { fetchApi } from './client';

export async function getUserNotifications() {
  return fetchApi('/notifications');
}

export async function markAsRead(id: string) {
  return fetchApi(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function markAllAsRead() {
  return fetchApi('/notifications/read-all', {
    method: 'PUT',
  });
}

export async function clearAll() {
  return fetchApi('/notifications', {
    method: 'DELETE',
  });
}
