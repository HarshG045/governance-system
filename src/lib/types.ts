export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Closed' | 'Needs Info' | 'Verified' | 'Cancelled';
export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ComplaintCategory = 'Road' | 'Water' | 'Electricity' | 'Sanitation' | 'Other';
export type UserRole = 'citizen' | 'official' | 'admin';

export interface Complaint {
  id: string;
  title: string;
  category: ComplaintCategory;
  department_id?: string;
  department?: string; // Kept for UI backwards compatibility if needed
  priority: ComplaintPriority;
  status: ComplaintStatus;
  date: string;
  created_at?: string;
  description: string;
  location: string;
  citizenName: string;
  citizenId: string;
  citizen_id?: string;
  assignedTo?: string;
  assigned_to?: string;
  ticket_number?: string;
  attachments?: Array<{ name: string; size?: string; type?: string }>;
  rawId?: number;
  comments: Comment[];
  departments?: Department;
  users?: AppUser; // Citizen
  assigned_user?: AppUser;
}

export interface Comment {
  id: string;
  complaint_id?: string;
  author_id?: string;
  author: string;
  role: string;
  message: string;
  timestamp: string;
  created_at?: string;
  users?: AppUser;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  department?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: string;
  created_at?: string;
  phone?: string;
  departments?: Department;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head_id?: string;
  head?: string;
  complaintsThisMonth?: number;
  officials?: number;
  description: string;
  created_at?: string;
  users?: AppUser; // head of department
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  type: 'complaint' | 'system' | 'info' | 'submit' | 'update' | 'close' | 'register' | 'admin';
  message: string;
  timestamp: string;
  created_at?: string;
  read: boolean;
  is_read?: boolean;
}
