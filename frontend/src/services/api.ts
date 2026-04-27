/**
 * API Service Layer — Connects new_frontend to the existing backend.
 * All endpoints, payload shapes, and response structures match the
 * backend exactly. Zero backend changes required.
 */

const API_BASE = '/api';

/* ─── Token / User helpers ─── */

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUser(): { id: string; name: string; email: string; role: string; departmentId?: string | null } | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(token: string, user: object): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/* ─── Generic request helpers ─── */

async function apiRequest<T = any>(endpoint: string, method: string = 'GET', body?: object): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts: RequestInit = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiFormData<T = any>(endpoint: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/* ─── Auth Service ─── */

export const authService = {
  login: (email: string, password: string) =>
    apiRequest<{ message: string; token: string; user: any }>('/auth/login', 'POST', { email, password }),

  register: (name: string, email: string, password: string) =>
    apiRequest<{ message: string; user: any }>('/auth/register', 'POST', { name, email, password, role: 'citizen' }),
};

/* ─── Citizen Service ─── */

export const citizenService = {
  getComplaints: () =>
    apiRequest<{ complaints: any[] }>('/complaints'),

  getComplaintById: (id: string) =>
    apiRequest<{ complaint: any }>(`/complaints/${id}`),

  submitComplaint: (formData: FormData) =>
    apiFormData<{ message: string; complaint: any }>('/complaints', formData),
};

/* ─── Department Service (citizen-accessible) ─── */

export const departmentService = {
  getDepartments: () =>
    apiRequest<{ departments: any[] }>('/departments'),
};

/* ─── Officer Service ─── */

export const officerService = {
  getComplaints: () =>
    apiRequest<{ complaints: any[] }>('/officer/complaints'),

  updateComplaint: (id: string, status: string, officer_remarks: string) =>
    apiRequest<{ message: string; complaint: any }>(`/officer/complaints/${id}`, 'PUT', { status, officer_remarks }),
};

/* ─── Admin Service ─── */

export const adminService = {
  getReports: () =>
    apiRequest<{
      totalComplaints: number;
      totalCitizens: number;
      totalOfficers: number;
      statusCount: Record<string, number>;
      complaintsByDepartment: Record<string, number>;
    }>('/admin/reports'),

  getComplaints: () =>
    apiRequest<{ complaints: any[] }>('/admin/complaints'),

  getUsers: () =>
    apiRequest<{ users: any[] }>('/admin/users'),

  getDepartments: () =>
    apiRequest<{ departments: any[] }>('/admin/departments'),

  addDepartment: (department_name: string) =>
    apiRequest<{ message: string; department: any }>('/admin/departments', 'POST', { department_name }),

  createOfficer: (name: string, email: string, password: string, departmentId: string) =>
    apiRequest<{ message: string; officer: any }>('/admin/officers', 'POST', { name, email, password, departmentId }),

  assignComplaint: (complaintId: string, departmentId: string) =>
    apiRequest<{ message: string; complaint: any }>('/admin/assign', 'PUT', { complaintId, departmentId }),
};
