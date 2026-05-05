import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Clock, CheckCircle, AlertCircle, Plus, Search, Download, Eye, Edit2, Loader2 } from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { complaintsApi, notificationsApi } from '../../../lib/api';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import type { Complaint, NotificationItem } from '../../../lib/types';
import { toast } from 'sonner';

export function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination bounds
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadData = async (showToast = false) => {
    if (!user?.id) return;
    if (!showToast) setLoading(true);
    setError(null);
    try {
      const [complaintsData, notifsData] = await Promise.all([
        complaintsApi.getAll(),
        notificationsApi.getUserNotifications()
      ]);
      setComplaints(complaintsData as any[]);
      setNotifications(notifsData as any[]);
      if (showToast) toast.success('Dashboard data refreshed');
    } catch {
      setError('Unable to load your dashboard data.');
      if (showToast) toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.name]);

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const currentComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return complaints.slice(startIndex, startIndex + itemsPerPage);
  }, [complaints, currentPage]);

  const stats = [
    { label: 'Total Complaints', value: total, sub: 'submitted by you', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: pending, sub: 'awaiting action', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Progress', value: inProgress, sub: 'being resolved', icon: AlertCircle, color: 'text-[#1A56DB]', bg: 'bg-blue-50' },
    { label: 'Resolved', value: resolved, sub: 'successfully closed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const handleDownloadReport = () => {
    if (complaints.length === 0) {
      toast.info('No data available to download');
      return;
    }
    const headers = ['ID', 'Title', 'Category', 'Status', 'Date'];
    const csvRows = complaints.map(c => [
      c.ticket_number || c.id,
      `"${c.title?.replace(/"/g, '""') || ''}"`,
      c.category,
      c.status,
      c.created_at ? new Date(c.created_at).toLocaleDateString() : c.date || ''
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `my_complaints_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error.message || 'Unable to mark notifications as read');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[500px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1A56DB]" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-[400px] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex flex-col items-center max-w-md text-center">
          <AlertCircle className="w-10 h-10 mb-3 text-red-500" />
          <h3 className="font-semibold mb-1">Could not load dashboard</h3>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => loadData()}
            className="px-4 py-2 bg-white text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-gray-900 font-semibold text-2xl">Good morning, {user?.name?.split(' ')[0] || 'Citizen'} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's an overview of your complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate('/citizen/submit')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A56DB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Submit New Complaint
        </button>
        <button
          onClick={() => navigate('/citizen/complaints')}
          className="flex items-center gap-2 px-4 py-2 border border-[#1A56DB] text-[#1A56DB] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          <Search className="w-4 h-4" /> View All Complaints
        </button>
        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-gray-900 font-semibold">My Recent Complaints</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 font-medium">No complaints found</p>
                        <button 
                          onClick={() => navigate('/citizen/submit')}
                          className="mt-3 text-xs text-blue-600 hover:underline"
                        >
                          Submit your first complaint
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.ticket_number || c.id?.substring?.(0,8)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-[180px] truncate">{c.title}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{c.category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : c.date}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/citizen/track/${c.id}`)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {c.status === 'Pending' && (
                            <button
                              onClick={() => navigate(`/citizen/edit/${c.id}`)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {total > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between mt-auto">
              <span className="text-xs text-gray-500">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, total)}–{Math.min(currentPage * itemsPerPage, total)} of {total}
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <div className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded bg-gray-50">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-gray-900 font-semibold">Recent Notifications</h3>
            {notifications.some(n => !n.is_read) && (
              <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline font-medium">Mark all read</button>
            )}
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[500px]">
            {notifications.map((n) => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at || '').toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-8 flex flex-col items-center justify-center text-center h-full text-sm text-gray-500">
                <Clock className="w-8 h-8 text-gray-300 mb-2" />
                No recent notifications
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
