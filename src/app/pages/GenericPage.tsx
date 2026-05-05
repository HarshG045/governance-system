import { useEffect, useState } from 'react';
import { Save, User } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { usersApi } from '../../lib/api';
import { toast } from 'sonner';

interface GenericPageProps {
  title: string;
  description?: string;
}

export function GenericPage({ title, description }: GenericPageProps) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setDepartment(user?.department || '');
  }, [user]);

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (user?.role === 'official' && !department.trim()) nextErrors.department = 'Department is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !user) return;

    setSaving(true);
    try {
      await usersApi.update(user.id, { name: name.trim(), phone: phone.trim(), department: department.trim() || null });
      toast.success('Profile saved');
    } catch (error: any) {
      toast.error(error.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-gray-900 text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-semibold">Account Profile</h2>
            <p className="text-xs text-gray-400">Changes are saved to your backend user record.</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Full Name</label>
            <input value={name} onChange={event => setName(event.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input value={user?.email || ''} disabled className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Phone</label>
            <input value={phone} onChange={event => setPhone(event.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 99999 99999" />
          </div>
          {user?.role === 'official' && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Department</label>
              <select value={department} onChange={event => setDepartment(event.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select department</option>
                <option>Public Works Department</option>
                <option>Water Supply Board</option>
                <option>Electricity Board</option>
                <option>Municipal Corporation</option>
                <option>Town Planning</option>
              </select>
              {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
            </div>
          )}
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A56DB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
