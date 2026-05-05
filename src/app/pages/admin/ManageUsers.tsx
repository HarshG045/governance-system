import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Search, Edit2, Trash2, Clock, Filter, AlertCircle, Users } from 'lucide-react';
import { usersApi } from '../../../lib/api';
import type { AppUser, UserRole } from '../../../lib/types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { toast } from 'sonner';

type RoleFilter = 'All' | UserRole;
type StatusFilter = 'All' | 'Active' | 'Inactive' | 'Suspended';

const roleBadge: Record<string, string> = {
  citizen: 'bg-blue-100 text-blue-700',
  official: 'bg-teal-100 text-teal-700',
  admin: 'bg-red-100 text-red-700',
};

const statusBadge: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-600',
  Suspended: 'bg-red-100 text-red-700',
};

const itemsPerPage = 8;

export function ManageUsers() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activityUser, setActivityUser] = useState<AppUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('citizen');
  const [formDept, setFormDept] = useState('');
  const [formActive, setFormActive] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.getAll();
      setUsers(data as AppUser[]);
    } catch (err: any) {
      const message = err.message || 'Unable to load users';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const filtered = useMemo(() => users.filter(u => {
    const term = search.trim().toLowerCase();
    const matchSearch = !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  }), [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormRole('citizen');
    setFormDept('');
    setFormActive(true);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormPhone(u.phone || '');
    setFormRole(u.role);
    setFormDept(u.department || '');
    setFormActive(u.status === 'Active');
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formName.trim()) nextErrors.name = 'Full name is required';
    if (!formEmail.trim()) nextErrors.email = 'Email is required';
    if (formEmail && !/^\S+@\S+\.\S+$/.test(formEmail)) nextErrors.email = 'Enter a valid email address';
    if (!editUser && formPassword.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (formRole === 'official' && !formDept.trim()) nextErrors.department = 'Department is required for officials';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        phone: formPhone.trim(),
        role: formRole,
        department: formRole === 'official' ? formDept : null,
        status: formActive ? 'Active' : 'Inactive',
      };

      if (editUser) {
        const updated = await usersApi.update(editUser.id, payload);
        setUsers(prev => prev.map(u => u.id === editUser.id ? updated as AppUser : u));
        toast.success('User updated');
      } else {
        const created = await usersApi.create(payload);
        setUsers(prev => [created as AppUser, ...prev]);
        toast.success('User created');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Unable to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const snapshot = users;
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteConfirm(null);
    try {
      await usersApi.remove(id);
      toast.success('User deleted');
    } catch (err: any) {
      setUsers(snapshot);
      toast.error(err.message || 'Unable to delete user');
    }
  };

  const toggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const updated = await usersApi.update(id, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === id ? updated as AppUser : u));
      toast.success(`User marked ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Unable to update user status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total users</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-10 pr-3 h-9 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleFilter)} className="h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
              <option value="All">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="official">Official</option>
              <option value="admin">Admin</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className="h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Created</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}><td colSpan={6} className="px-4 py-3"><div className="h-10 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-red-600">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    {error}
                    <div><button onClick={load} className="mt-3 px-3 py-1.5 border border-red-200 rounded-lg text-xs hover:bg-red-50">Try again</button></div>
                  </td>
                </tr>
              )}
              {!loading && !error && paged.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${roleBadge[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{u.department || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(u.id)} title="Click to toggle status" className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadge[u.status]} hover:opacity-80 transition-opacity cursor-pointer`}>
                      {u.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{u.created_at ? new Date(u.created_at).toLocaleDateString() : u.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setActivityUser(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Activity"><Clock className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium">No users found</p>
                    <button onClick={openAdd} className="mt-2 text-xs text-red-600 hover:underline">Create your first user</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">Showing {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} users</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button className="px-2 py-1 text-xs border border-[#DC2626] bg-red-50 text-[#DC2626] rounded">{currentPage} / {totalPages}</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={event => event.stopPropagation()}>
            <h3 className="text-gray-900 mb-5">{editUser ? 'Edit User' : 'Add New User'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Full name" />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} disabled={!!editUser} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50" placeholder="email@example.com" />
                {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Temporary Password</label>
                  <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Minimum 6 characters" />
                  {formErrors.password && <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="+91 99999 99999" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Role</label>
                  <select value={formRole} onChange={e => setFormRole(e.target.value as UserRole)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    <option value="citizen">Citizen</option><option value="official">Official</option><option value="admin">Admin</option>
                  </select>
                </div>
                {formRole === 'official' && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Department</label>
                    <select value={formDept} onChange={e => setFormDept(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                      <option value="">Select...</option>
                      <option>Public Works Department</option>
                      <option>Water Supply Board</option>
                      <option>Electricity Board</option>
                      <option>Municipal Corporation</option>
                      <option>Town Planning</option>
                    </select>
                    {formErrors.department && <p className="text-xs text-red-600 mt-1">{formErrors.department}</p>}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} className="accent-red-600" />
                <span className="text-sm text-gray-700">Active account</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {activityUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setActivityUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={event => event.stopPropagation()}>
            <h3 className="text-gray-900 mb-3">User Activity</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="text-gray-400">Name:</span> {activityUser.name}</p>
              <p><span className="text-gray-400">Role:</span> {activityUser.role}</p>
              <p><span className="text-gray-400">Status:</span> {activityUser.status}</p>
              <p><span className="text-gray-400">Created:</span> {activityUser.created_at ? new Date(activityUser.created_at).toLocaleString() : activityUser.createdAt}</p>
            </div>
            <button onClick={() => setActivityUser(null)} className="mt-5 w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Close</button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
