import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Timeline } from '../components/Timeline';
import { citizenService } from '@/services/api';

export function TrackComplaintPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await citizenService.getComplaints();
        setComplaints(data.complaints || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch complaints');
      } finally {
        setIsLoadingComplaints(false);
      }
    };
    fetchComplaints();
  }, []);

  const handleViewTimeline = async (id: string) => {
    setSelectedComplaintId(id);
    setIsLoadingTimeline(true);
    setTimelineData([]);
    
    try {
      const data = await citizenService.getComplaintById(id);
      if (data.complaint && data.complaint.timeline) {
        // Map backend timeline to Timeline component steps
        // Backend timeline items have: { status, note, by, timestamp }
        // We also need to add pending steps if the complaint is not resolved
        
        const backendSteps = data.complaint.timeline;
        const currentStatus = data.complaint.status;
        
        const steps = backendSteps.map((item: any, idx: number) => ({
          label: item.status,
          status: idx === backendSteps.length - 1 && currentStatus !== 'Resolved' ? 'current' : 'completed',
          date: new Date(item.timestamp).toLocaleString(),
          remarks: item.note || ''
        }));
        
        // Add pending steps based on current status
        if (currentStatus === 'Submitted') {
          steps.push({ label: 'In Progress', status: 'pending' });
          steps.push({ label: 'Resolved', status: 'pending' });
        } else if (currentStatus === 'In Progress' || currentStatus === 'In-Progress') {
          steps.push({ label: 'Resolved', status: 'pending' });
        }
        
        setTimelineData(steps);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const columns = [
    { key: 'complaint_id', header: 'Complaint ID', mono: true },
    { key: 'title', header: 'Title' },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => <Badge type="status" value={status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <Button
          variant="ghost"
          onClick={() => handleViewTimeline(row.complaint_id || row.id)}
        >
          View Timeline
        </Button>
      )
    }
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6">Track Complaints</h1>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card header="All Complaints">
            {isLoadingComplaints ? (
              <div className="py-8 text-center text-[var(--text-muted)]">Loading complaints...</div>
            ) : (
              <Table columns={columns} data={complaints} />
            )}
          </Card>
        </div>

        <div>
          <Card header="Complaint Timeline">
            {!selectedComplaintId ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                Select a complaint to view its timeline
              </p>
            ) : isLoadingTimeline ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                Loading timeline...
              </p>
            ) : (
              <Timeline steps={timelineData} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
