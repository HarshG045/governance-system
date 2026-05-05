import { useState } from 'react';
import { Plus, Edit2, Eye, Building2, AlertCircle, Trash2 } from 'lucide-react';
import { departmentsApi, usersApi } from '../../../lib/api';
import type { Department, AppUser } from '../../../lib/types';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/common/ConfirmModal';

const deptIcons: Record<string, string> = {
  'Public Works Department': '🏗️',
  'Water Supply Board': '💧',
  'Electricity Board': '⚡',
  'Municipal Corporation': '🏛️',
  'Town Planning': '📐',
  'Parks Department': '🌳',
};

export function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officials, setOfficials] = useState<AppUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [viewDept, setViewDept] = useState<Department | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formHeadId, setFormHeadId] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [depts, users] = await Promise.all([
        departmentsApi.getAll(),
        usersApi.getAll({ role: 'official' })
      ]);
      setDepartments(depts as any[]);
      setOfficials(users as any[]);
    } catch (err: any) {
      const message = err.message || 'Unable to load departments';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditDept(null);
    setFormName(''); setFormCode(''); setFormHeadId(''); setFormDesc('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (d: Department) => {
    setEditDept(d);
    setFormName(d.name); setFormCode(d.code); setFormHeadId(d.head_id || ''); setFormDesc(d.description);
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!formName.trim()) nextErrors.name = 'Department name is required';
    if (!formCode.trim()) nextErrors.code = 'Department code is required';
    if (!formDesc.trim()) nextErrors.description = 'Description is required';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const payload = { name: formName, code: formCode, head_id: formHeadId || null, description: formDesc };
      if (editDept) {
        await departmentsApi.update(editDept.id, payload);
        toast.success('Department updated');
      } else {
        await departmentsApi.create(payload);
        toast.success('Department created');
      }
      await load();
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Unable to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDept) return;
    const snapshot = departments;
    setDepartments(prev => prev.filter(dept => dept.id !== deleteDept.id));
    setDeleteDept(null);
    try {
      await departmentsApi.remove(deleteDept.id);
      toast.success('Department deleted');
    } catch (err: any) {
      setDepartments(snapshot);
      toast.error(err.message || 'Unable to delete department');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900">Manage Departments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{departments.length} departments configured</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
          <button onClick={load} className="mt-3 px-3 py-1.5 border border-red-200 rounded-lg text-xs hover:bg-red-50">Try again</button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map(d => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-xl">
                  {deptIcons[d.name] || '🏢'}
                </div>
                <div>
                  <h4 className="text-gray-900 text-sm">{d.name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{d.code}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">{d.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-amber-700">{d.complaintsThisMonth}</div>
                <div className="text-xs text-amber-600">This Month</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-700">{d.officials}</div>
                <div className="text-xs text-blue-600">Officials</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              <span>Head:</span>
              <span className="font-medium text-gray-700">{d.head || (d.users ? d.users.name : 'Unassigned')}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEdit(d)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => setViewDept(d)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">
                <Eye className="w-3 h-3" /> View
              </button>
              <button onClick={() => setDeleteDept(d)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <button
          onClick={openAdd}
          className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-3 hover:border-red-300 hover:bg-red-50/30 transition-colors min-h-[240px]"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Add Department</p>
            <p className="text-xs text-gray-400">Create a new department</p>
          </div>
        </button>
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={event => event.stopPropagation()}>
            <h3 className="text-gray-900 mb-5">{editDept ? 'Edit Department' : 'Add Department'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Department Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g. Public Works" />
                  {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Code</label>
                  <input value={formCode} onChange={e => setFormCode(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g. PWD" />
                  {formErrors.code && <p className="text-xs text-red-600 mt-1">{formErrors.code}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Head Official</label>
                <select value={formHeadId} onChange={e => setFormHeadId(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="">Select official...</option>
                  {officials.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Department description and responsibilities..." />
                {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {viewDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewDept(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={event => event.stopPropagation()}>
            <h3 className="text-gray-900 mb-3">{viewDept.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="text-gray-400">Code:</span> {viewDept.code}</p>
              <p><span className="text-gray-400">Head:</span> {viewDept.head || 'Unassigned'}</p>
              <p><span className="text-gray-400">Officials:</span> {viewDept.officials || 0}</p>
              <p><span className="text-gray-400">This month:</span> {viewDept.complaintsThisMonth || 0} complaints</p>
              <p><span className="text-gray-400">Description:</span> {viewDept.description}</p>
            </div>
            <button onClick={() => setViewDept(null)} className="mt-5 w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Close</button>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteDept}
        title="Delete Department"
        message="Delete this department? Existing linked records will lose the department reference."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDept(null)}
      />
    </div>
  );
}
