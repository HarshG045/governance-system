import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Banner } from '../components/Banner';
import { adminService } from '@/services/api';

export function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDept, setNewDept] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDepartments();
      setDepartments(data.departments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    setError('');
    setSuccessMsg('');

    try {
      await adminService.addDepartment(newDept.trim());
      setSuccessMsg('Department added successfully');
      setNewDept('');
      fetchDepartments(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to add department');
    }
  };

  const columns = [
    { key: 'department_name', header: 'Department Name' },
    // The current backend might not return head or officers count directly on this endpoint,
    // we'll put N/A if it's missing, but the UI expects it.
    { key: 'head', header: 'Department Head', render: (val: any) => val || 'Not Assigned' },
    { key: 'officers', header: 'Number of Officers', render: (val: any) => val ?? 0 }
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6">Department Management</h1>

      {error && <Banner type="error" message={error} className="mb-4" />}
      {successMsg && <Banner type="success" message={successMsg} className="mb-4" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card header="Add New Department">
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <Input
                label="Department Name"
                placeholder="Enter department name"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                required
              />

              <Button type="submit" className="w-full">
                Add Department
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card header="All Departments">
            {isLoading ? (
               <div className="py-8 text-center text-[var(--text-muted)]">Loading departments...</div>
            ) : (
              <Table columns={columns} data={departments} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
