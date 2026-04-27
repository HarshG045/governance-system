import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Select } from '../components/Select';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { officerService } from '@/services/api';

export function ComplaintManagementPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await officerService.getComplaints();
      // Initialize a remarks field for local editing state for each complaint
      const withRemarks = (data.complaints || []).map((c: any) => ({
        ...c,
        editStatus: c.status,
        officer_remarks: ''
      }));
      setComplaints(withRemarks);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateComplaintLocal = (id: string, field: string, value: string) => {
    setComplaints(prev =>
      prev.map(c => c.complaint_id === id ? { ...c, [field]: value } : c)
    );
  };

  const saveComplaint = async (id: string) => {
    setError('');
    setSuccessMsg('');
    const complaint = complaints.find(c => c.complaint_id === id);
    if (!complaint) return;

    try {
      await officerService.updateComplaint(id, complaint.editStatus, complaint.officer_remarks);
      setSuccessMsg(`Complaint ${id} updated successfully`);
      // Refresh to get actual updated timeline/status
      fetchComplaints();
    } catch (err: any) {
      setError(err.message || `Failed to update complaint ${id}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6">Manage Complaints</h1>

      {error && <Banner type="error" message={error} className="mb-4" />}
      {successMsg && <Banner type="success" message={successMsg} className="mb-4" />}

      <Card header="Assigned Complaints">
        <div className="space-y-4">
          {isLoading ? (
             <div className="py-8 text-center text-[var(--text-muted)]">Loading complaints...</div>
          ) : complaints.length === 0 ? (
             <div className="py-8 text-center text-[var(--text-muted)]">No complaints assigned to you.</div>
          ) : complaints.map((complaint) => (
            <div
              key={complaint.complaint_id}
              className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--page-bg)]"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--text-hint)] mb-1">ID</div>
                  <div className="font-mono text-sm">{complaint.complaint_id}</div>
                </div>

                <div className="md:col-span-3">
                  <div className="text-xs text-[var(--text-hint)] mb-1">Title</div>
                  <div className="text-sm font-medium">{complaint.title}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs text-[var(--text-hint)] mb-1">Status</div>
                  <Select
                    options={[
                      { value: 'Submitted', label: 'Submitted' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Resolved', label: 'Resolved' }
                    ]}
                    value={complaint.editStatus}
                    onChange={(e) => updateComplaintLocal(complaint.complaint_id, 'editStatus', e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="md:col-span-4">
                  <div className="text-xs text-[var(--text-hint)] mb-1">New Remarks</div>
                  <Input
                    placeholder="Add remarks..."
                    value={complaint.officer_remarks}
                    onChange={(e) => updateComplaintLocal(complaint.complaint_id, 'officer_remarks', e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="md:col-span-1 flex items-end">
                  <Button
                    variant="primary"
                    onClick={() => saveComplaint(complaint.complaint_id)}
                    className="w-full md:w-auto"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
