import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, Eye, Edit2, Search, Filter, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { complaintsApi } from '../../../lib/api';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import type { Complaint, ComplaintStatus } from '../../../lib/types';
import { toast } from 'sonner';

const filters: (ComplaintStatus | 'All')[] = ['All', 'Pending', 'In Progress', 'Needs Info', 'Resolved', 'Closed'];
const itemsPerPage = 8;

type SortKey = 'title' | 'status' | 'created_at';

export function MyComplaints() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<ComplaintStatus | 'All'>('All');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = async () => {
    if (!user) {
      setComplaints([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const rows = await complaintsApi.getAll();
      setComplaints(rows as Complaint[]);
    } catch (err: any) {
      const message = err.message || 'Unable to load complaints';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter]);

  const filtered = useMemo(() => {
    return complaints
      .filter(c => {
        const term = search.trim().toLowerCase();
        const matchFilter = activeFilter === 'All' || c.status === activeFilter;
        const matchSearch = !term ||
          c.title.toLowerCase().includes(term) ||
          String(c.ticket_number || c.id).toLowerCase().includes(term) ||
          c.location.toLowerCase().includes(term);
        return matchFilter && matchSearch;
      })
      .sort((a, b) => {
        const aValue = String((a as any)[sortKey] || '');
        const bValue = String((b as any)[sortKey] || '');
        return sortDir === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
  }, [complaints, search, activeFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900">My Complaints</h1>
          <p className="text-sm text-gray-500 mt-0.5">{complaints.length} total complaints</p>
        </div>
        <button
          onClick={() => navigate('/citizen/submit')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A56DB] text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Complaint
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search complaints..."
              className="w-full pl-10 pr-3 h-9 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === f ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Complaint ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <button onClick={() => handleSort('title')}>Title</button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  <button onClick={() => handleSort('created_at')}>Date</button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <button onClick={() => handleSort('status')}>Status</button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={7} className="px-4 py-3"><div className="h-10 bg-gray-100 rounded animate-pulse" /></td>
                </tr>
              ))}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-600">{error}</p>
                    <button onClick={load} className="mt-3 px-3 py-1.5 border border-red-200 text-red-700 rounded-lg text-xs hover:bg-red-50">Try again</button>
                  </td>
                </tr>
              )}
              {!loading && !error && paged.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.ticket_number || String(c.id).substring(0, 8)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 max-w-[200px] truncate font-medium">{c.title}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[200px]">{c.location}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{c.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell"><PriorityBadge priority={c.priority} /></td>
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
              ))}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No complaints found</p>
                    <p className="text-xs text-gray-400 mt-1">Create a new complaint or clear filters to see existing records.</p>
                    <div className="mt-3 flex justify-center gap-2">
                      <button onClick={() => navigate('/citizen/submit')} className="text-xs text-blue-600 hover:underline">Create your first complaint</button>
                      <button onClick={() => { setSearch(''); setActiveFilter('All'); }} className="text-xs text-gray-500 hover:underline">Clear filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button className="px-2 py-1 text-xs border border-[#1A56DB] bg-blue-50 text-[#1A56DB] rounded">{currentPage} / {totalPages}</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
