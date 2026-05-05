import { Users, ClipboardList, Clock, Server, UserCheck, CheckCircle, RefreshCw, Download, Loader2, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { complaintsApi, usersApi, notificationsApi } from '../../../lib/api';
import type { Complaint, AppUser, NotificationItem } from '../../../lib/types';
import { toast } from 'sonner';

const activityColor: Record<string, string> = {
  submit: 'bg-blue-100 text-blue-700',
  update: 'bg-teal-100 text-teal-700',
  close: 'bg-green-100 text-green-700',
  register: 'bg-purple-100 text-purple-700',
  info: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
};

export function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async (showToast = false) => {
    try {
      if (!showToast) setLoading(true);
      setError(null);
      const [c, u, n] = await Promise.all([
        complaintsApi.getAll(),
        usersApi.getAll(),
        notificationsApi.getUserNotifications()
      ]);
      setComplaints(c as any[]);
      setUsers(u as any[]);
      setNotifications(n as any[]);
      if (showToast) toast.success('Dashboard refreshed');
    } catch {
      setError('Failed to load dashboard data. Please try again.');
      if (showToast) toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCsv = () => {
    try {
      if (complaints.length === 0) {
        toast.info('No complaints available to export');
        return;
      }
      const headers = ['ID', 'Title', 'Category', 'Department', 'Status', 'Priority', 'Created At'];
      const csvRows = complaints.map(c => [
        c.id,
        `"${c.title?.replace(/"/g, '""') || ''}"`,
        c.category,
        c.department,
        c.status,
        c.priority,
        c.created_at
      ].join(','));
      
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaints_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const stats = useMemo(() => [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Live' },
    { label: 'Active Officials', value: users.filter(u => u.role === 'official' && u.status === 'Active').length, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50', trend: 'Live' },
    { label: 'Total Complaints', value: complaints.length, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Live' },
    { label: 'Pending Complaints', value: complaints.filter(c => c.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Live' },
    { label: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: 'Live' },
    { label: 'System Uptime', value: '100%', icon: Server, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Stable' },
  ], [complaints, users]);

  const chartBarData = useMemo(() => {
    const counts = complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.keys(counts).map(k => ({ category: k, count: counts[k] }));
  }, [complaints]);

  const chartPieData = useMemo(() => {
    const counts = complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    const colors: Record<string, string> = { 'Pending': '#D97706', 'In Progress': '#1A56DB', 'Resolved': '#16A34A', 'Closed': '#64748B' };
    return Object.keys(counts).map(k => ({ name: k, value: counts[k], color: colors[k] || '#94A3B8' }));
  }, [complaints]);

  // Use real data to build the chartLineData
  const chartLineData = useMemo(() => {
    // Generate a simple historical trend view mapping dates to submitted vs resolved
    const recent = [...complaints].sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
    if (recent.length === 0) return [];
    
    // Simplification for the sake of the trend chart: process by month/date snippet
    const groups: Record<string, { submitted: number, resolved: number }> = {};
    recent.forEach(c => {
      const d = c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Unknown';
      if (!groups[d]) groups[d] = { submitted: 0, resolved: 0 };
      groups[d].submitted++;
      if (c.status === 'Resolved' || c.status === 'Closed') {
        groups[d].resolved++;
      }
    });

    const entries = Object.keys(groups).map(k => ({ date: k, ...groups[k] }));
    // Take the last 7 entries
    return entries.slice(-7);
  }, [complaints]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1A56DB]" />
        <p>Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-[400px] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex flex-col items-center max-w-md text-center">
          <AlertCircle className="w-10 h-10 mb-3 text-red-500" />
          <h3 className="font-semibold mb-1">Dashboard Error</h3>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => fetchData()}
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-semibold text-2xl">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">System overview and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExportCsv()}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => fetchData(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1A56DB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <div className={`text-xs mt-0.5 font-medium ${s.trend.startsWith('+') ? 'text-green-600' : s.trend.startsWith('-') ? 'text-red-500' : 'text-gray-400'}`}>
              {s.trend} this month
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-gray-900 mb-4 font-semibold">Complaints by Category</h3>
            {chartBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartBarData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#1A56DB" radius={[4, 4, 0, 0]} name="Complaints" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No category data available</div>
            )}
          </div>

          {/* Line Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-gray-900 mb-4 font-semibold">Complaint Resolution Trend (Recent)</h3>
            {chartLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="submitted" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="Submitted" />
                  <Line type="monotone" dataKey="resolved" stroke="#16A34A" strokeWidth={2} dot={{ r: 4 }} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No trend data available</div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-gray-900 mb-4 font-semibold">Status Distribution</h3>
            {chartPieData.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={chartPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {chartPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {chartPieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-sm text-gray-700">{d.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">No status data available</div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 font-semibold">Live Activity Feed</h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time system events</p>
            </div>
            {notifications.length > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{notifications.length} total</span>}
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[600px]">
            {notifications.slice(0, 10).map(a => (
              <div key={a.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${activityColor[a.type] || 'bg-gray-100 text-gray-600'}`}>
                    {a.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-relaxed">
                      <span className="font-medium">System</span> {a.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at || '').toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Clock className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Events will appear here as they happen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
