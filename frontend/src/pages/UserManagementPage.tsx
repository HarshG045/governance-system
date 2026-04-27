import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Banner } from '../components/Banner';
import { adminService } from '@/services/api';

export function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    role: 'officer'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, depsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getDepartments()
      ]);
      setUsers(usersData.users || []);
      setDepartments(depsData.departments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await adminService.createOfficer(formData.name, formData.email, formData.password, formData.departmentId);
      setSuccessMsg('Officer created successfully');
      setFormData({ name: '', email: '', password: '', departmentId: '', role: 'officer' });
      fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to create officer');
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (role: string) => <Badge type="role" value={role} />
    },
    { key: 'department_name', header: 'Department', render: (val: string) => val || 'N/A' }
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6">User Management</h1>

      {error && <Banner type="error" message={error} className="mb-4" />}
      {successMsg && <Banner type="success" message={successMsg} className="mb-4" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card header="Create Officer Account">
            <form className="space-y-4" onSubmit={handleCreate}>
              <Input 
                label="Full Name" 
                placeholder="Enter name" 
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                required 
              />
              <Input 
                label="Email" 
                type="email" 
                placeholder="email@pcmc.gov.in" 
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                required 
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="Set password" 
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                required 
              />

              <Select
                label="Department"
                value={formData.departmentId}
                onChange={e => setFormData(p => ({ ...p, departmentId: e.target.value }))}
                options={[
                  { value: '', label: 'Select department...' },
                  ...departments.map(d => ({ value: String(d.id), label: d.department_name }))
                ]}
                required
              />

              <Select
                label="Role"
                value={formData.role}
                disabled
                options={[
                  { value: 'officer', label: 'Officer' }
                ]}
              />

              <Button type="submit" className="w-full">
                Create User
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card header="All Users">
            {isLoading ? (
               <div className="py-8 text-center text-[var(--text-muted)]">Loading users...</div>
            ) : (
              <Table columns={columns} data={users} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
