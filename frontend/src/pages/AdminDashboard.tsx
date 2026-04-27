import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { adminService } from '@/services/api';

export function AdminDashboard() {
  const [reports, setReports] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [assignForm, setAssignForm] = useState({
    complaintId: '',
    departmentId: ''
  });

  const fetchData = async () => {
    try {
      const [reportsData, depsData, complaintsData] = await Promise.all([
        adminService.getReports(),
        adminService.getDepartments(),
        adminService.getComplaints()
      ]);
      setReports(reportsData);
      setDepartments(depsData.departments || []);
      setComplaints(complaintsData.complaints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await adminService.assignComplaint(assignForm.complaintId, assignForm.departmentId);
      setSuccessMsg('Complaint assigned successfully');
      setAssignForm({ complaintId: '', departmentId: '' });
      fetchData(); // refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to assign complaint');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="mb-6">Admin Dashboard</h1>

      {error && <Banner type="error" message={error} className="mb-4" />}
      {successMsg && <Banner type="success" message={successMsg} className="mb-4" />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Complaints" value={reports?.totalComplaints || 0} description="All time complaints" />
        <StatCard title="Registered Citizens" value={reports?.totalCitizens || 0} description="Active users" />
        <StatCard title="Active Officers" value={reports?.totalOfficers || 0} description="Municipal officers" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card header="Complaint Status Overview">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-[var(--status-submitted-bg)] rounded-md">
              <span className="font-medium text-[var(--status-submitted)]">Submitted</span>
              <span className="text-2xl font-semibold text-[var(--status-submitted)]">{reports?.statusCount?.Submitted || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[var(--status-in-progress-bg)] rounded-md">
              <span className="font-medium text-[var(--status-in-progress)]">In Progress</span>
              <span className="text-2xl font-semibold text-[var(--status-in-progress)]">
                {(reports?.statusCount?.['In Progress'] || 0) + (reports?.statusCount?.['In-Progress'] || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[var(--status-resolved-bg)] rounded-md">
              <span className="font-medium text-[var(--status-resolved)]">Resolved</span>
              <span className="text-2xl font-semibold text-[var(--status-resolved)]">{reports?.statusCount?.Resolved || 0}</span>
            </div>
          </div>
        </Card>

        <Card header="Assign Complaint to Department">
          <form className="space-y-4" onSubmit={handleAssign}>
            <Select
              label="Complaint ID"
              value={assignForm.complaintId}
              onChange={(e) => setAssignForm(prev => ({ ...prev, complaintId: e.target.value }))}
              options={[
                { value: '', label: 'Select complaint...' },
                ...complaints.filter(c => c.status !== 'Resolved').map(c => ({
                  value: c.complaint_id,
                  label: `${c.complaint_id} - ${c.title}`
                }))
              ]}
              required
            />

            <Select
              label="Assign to Department"
              value={assignForm.departmentId}
              onChange={(e) => setAssignForm(prev => ({ ...prev, departmentId: e.target.value }))}
              options={[
                { value: '', label: 'Select department...' },
                ...departments.map(d => ({
                  value: String(d.id),
                  label: d.department_name
                }))
              ]}
              required
            />

            <Button type="submit" className="w-full">
              Assign Complaint
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
