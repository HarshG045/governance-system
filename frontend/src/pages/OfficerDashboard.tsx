import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { officerService } from '@/services/api';

export function OfficerDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await officerService.getComplaints();
        setComplaints(data.complaints || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch complaints');
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const pendingCount = complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  const columns = [
    { key: 'complaint_id', header: 'ID', mono: true },
    { key: 'title', header: 'Title' },
    { key: 'department_name', header: 'Department' },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => <Badge type="status" value={status} />
    },
    { 
      key: 'created_at', 
      header: 'Date',
      render: (dateStr: string) => new Date(dateStr).toLocaleDateString()
    }
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6">Officer Dashboard</h1>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Assigned to Me" value={complaints.length} description="Total assigned complaints" />
        <StatCard title="Pending Action" value={pendingCount} description="Require immediate attention" />
        <StatCard title="Resolved" value={resolvedCount} description="Successfully completed" />
      </div>

      <Card header="Recent Complaints">
        {isLoading ? (
           <div className="py-8 text-center text-[var(--text-muted)]">Loading complaints...</div>
        ) : (
          <Table columns={columns} data={complaints.slice(0, 10)} /> // Show top 10 recent
        )}
      </Card>
    </div>
  );
}
