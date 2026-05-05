import { fetchApi } from './client';

export async function getByComplaint(complaintId: string) {
  return fetchApi(`/complaints/${complaintId}/comments`);
}

export async function create(complaintId: string, commentData: any) {
  return fetchApi(`/complaints/${complaintId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
}

export async function remove(id: string) {
  return fetchApi(`/comments/${id}`, {
    method: 'DELETE',
  });
}
