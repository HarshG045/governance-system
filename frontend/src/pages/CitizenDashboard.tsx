import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { citizenService } from '@/services/api';

export function CitizenDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await citizenService.getComplaints();
        // The backend might return { complaints: [...] }
        setComplaints(data.complaints || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch complaints');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const columns = [
    { key: 'complaint_id', header: 'Complaint ID', mono: true },
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
      <h1 className="mb-6">My Dashboard</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <Card
        header="My Complaints"
        actions={
          <Button onClick={() => navigate('/submit-complaint')}>
            New Complaint
          </Button>
        }
      >
        {isLoading ? (
          <div className="py-8 text-center text-[var(--text-muted)]">Loading complaints...</div>
        ) : (
          <Table columns={columns} data={complaints} />
        )}
      </Card>
    </div>
  );
}
