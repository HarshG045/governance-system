import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, CalendarDays, FileText, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import type { Complaint } from '../../data/mockData';
import { fetchComplaints, normalizeComplaint } from '../../utils/complaintApi';

export function TrackComplaint() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true);
      try {
        const rows = await fetchComplaints(user?.id);
        const normalized = rows.map(row => normalizeComplaint(row, user?.name || 'Citizen'));
        setComplaints(normalized);
        setSelected(prev => prev ?? normalized[0] ?? null);
      } catch (error) {
        console.error(error);
        setComplaints([]);
        setSelected(null);
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, [user?.id, user?.name]);

  const visibleComplaints = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return complaints;
    return complaints.filter(complaint =>
      complaint.id.toLowerCase().includes(term) ||
      complaint.title.toLowerCase().includes(term) ||
      complaint.status.toLowerCase().includes(term) ||
      complaint.location.toLowerCase().includes(term)
    );
  }, [complaints, query]);

  const handleCancelComplaint = async () => {
    if (!selected?.rawId) return;
    if (!window.confirm('Cancel this complaint?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/complaints/${selected.rawId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('cancel failed');

      const updatedRow = await response.json();
      const updatedComplaint = normalizeComplaint(updatedRow, user?.name || 'Citizen');

      setComplaints(prev => prev.map(item => item.rawId === updatedComplaint.rawId ? updatedComplaint : item));
      setSelected(updatedComplaint);
    } catch (error) {
      console.error(error);
      alert('Failed to cancel complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const canCancel = Boolean(selected && !['Resolved', 'Closed', 'Cancelled'].includes(selected.status));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-gray-900">My Complaint Details</h1>
        <p className="text-sm text-gray-500 mt-0.5">You can only view complaints submitted from your account</p>
      </div>

      <div className="relative max-w-lg mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your complaints by ID, title, status, or location..."
          className="w-full pl-10 pr-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-2">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500">Loading your complaints...</div>
          ) : visibleComplaints.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500">No complaints found.</div>
          ) : (
            visibleComplaints.map(complaint => (
              <button
                key={complaint.id}
                onClick={() => setSelected(complaint)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected?.id === complaint.id ? 'border-[#1A56DB] bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">{complaint.id}</span>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-sm text-gray-900 font-medium line-clamp-1">{complaint.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{complaint.location}</p>
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-500">{selected.id}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <h3 className="text-gray-900">{selected.title}</h3>
                </div>
                <PriorityBadge priority={selected.priority} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Category</p>
                    <p>{selected.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Location</p>
                    <p>{selected.location}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CalendarDays className="w-4 h-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Submitted</p>
                    <p>{selected.date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Department</p>
                  <p>{selected.department}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Description</p>
                  <p className="text-sm leading-relaxed text-gray-700">{selected.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h4 className="text-gray-900 mb-3">Submitted details only</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="text-gray-400">Title:</span> {selected.title}</p>
                <p><span className="text-gray-400">Category:</span> {selected.category}</p>
                <p><span className="text-gray-400">Priority:</span> {selected.priority}</p>
                <p><span className="text-gray-400">Location:</span> {selected.location}</p>
                <p><span className="text-gray-400">Status:</span> {selected.status}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelComplaint}
                disabled={!canCancel || actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                {actionLoading ? 'Cancelling...' : 'Cancel Complaint'}
              </button>
              {!canCancel && (
                <span className="text-xs text-gray-500">Resolved, closed, or cancelled complaints cannot be cancelled again.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}