import type { Complaint, ComplaintStatus, ComplaintPriority } from '../data/mockData';

type ComplaintRow = {
  id: number;
  title: string;
  description: string | null;
  user_id: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  category?: string | null;
  department?: string | null;
  priority?: string | null;
  location?: string | null;
  attachments?: string | null;
};

const statusMap: Record<string, ComplaintStatus> = {
  submitted: 'Pending',
  pending: 'Pending',
  verified: 'Verified',
  'in progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  'needs info': 'Needs Info',
  cancelled: 'Cancelled',
};

const priorityMap: Record<string, ComplaintPriority> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function normalizeComplaint(row: ComplaintRow, citizenName = 'Citizen'): Complaint {
  const status = statusMap[(row.status || '').toLowerCase()] || 'Pending';
  const priority = priorityMap[(row.priority || 'medium').toLowerCase()] || 'Medium';
  const category = (row.category as Complaint['category']) || 'Other';

  return {
    id: `CMP-${String(row.id).padStart(5, '0')}`,
    rawId: row.id,
    title: row.title,
    category,
    department: row.department || 'Unassigned',
    priority,
    status,
    date: new Date(row.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    description: row.description || '',
    location: row.location || '',
    citizenName,
    citizenId: row.user_id || 'anonymous',
    comments: [],
  };
}

export async function fetchComplaints(userId?: string) {
  const url = userId ? `/api/complaints?userId=${encodeURIComponent(userId)}` : '/api/complaints';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load complaints');
  }
  return (await response.json()) as ComplaintRow[];
}

export async function fetchComplaintById(id: string | number) {
  const response = await fetch(`/api/complaints/${encodeURIComponent(String(id))}`);
  if (!response.ok) {
    throw new Error('Failed to load complaint');
  }
  return (await response.json()) as ComplaintRow;
}

