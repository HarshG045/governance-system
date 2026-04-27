import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { citizenService, departmentService } from '@/services/api';

export function SubmitComplaintPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Roads',
    departmentId: '',
    description: ''
  });

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const res = await departmentService.getDepartments();
        setDepartments(res.departments || []);
        if (res.departments && res.departments.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: String(res.departments[0].id) }));
        }
      } catch (err: any) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDeps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('category', formData.category);
      submitData.append('departmentId', formData.departmentId);
      submitData.append('description', formData.description);
      
      if (fileInputRef.current?.files?.[0]) {
        submitData.append('evidence', fileInputRef.current.files[0]);
      }
      
      await citizenService.submitComplaint(submitData);
      
      setSubmitted(true);
      setTimeout(() => {
        navigate('/citizen-dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6">Submit New Complaint</h1>

      {submitted && (
        <Banner
          type="success"
          message="Complaint submitted successfully! Redirecting to dashboard..."
          className="mb-6"
        />
      )}
      
      {error && <Banner type="error" message={error} className="mb-6" />}

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Complaint Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                required
              />

              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'Roads', label: 'Roads' },
                  { value: 'Water Supply', label: 'Water Supply' },
                  { value: 'Electricity', label: 'Electricity' },
                  { value: 'Sanitation', label: 'Sanitation' },
                  { value: 'Health', label: 'Health' },
                  { value: 'Housing', label: 'Housing' },
                  { value: 'Other', label: 'Other' }
                ]}
              />

              <Select
                label="Department"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                options={departments.map(d => ({ value: String(d.id), label: d.department_name }))}
                required
              />
            </div>

            <div className="space-y-4">
              <Textarea
                label="Detailed Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information about the complaint"
                rows={8}
                required
              />

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Attach Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="block w-full text-sm text-[var(--text-muted)]
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border file:border-[var(--border-color)]
                    file:text-sm file:font-medium
                    file:bg-white file:text-[var(--text-primary)]
                    hover:file:bg-[var(--section-bg)]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => navigate('/citizen-dashboard')} disabled={isSubmitting || submitted}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || submitted}>
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
