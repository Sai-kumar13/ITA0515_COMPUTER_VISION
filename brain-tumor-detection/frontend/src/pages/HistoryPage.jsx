import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHistory, deleteHistory } from '../services/api';
import {
  Search, Filter, SortAsc, SortDesc, Trash2, Eye,
  Loader2, AlertCircle, FileX,
} from 'lucide-react';

export default function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const perPage = 9;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      if (filter) params.filter = filter;
      const data = await getHistory(params);
      let items = data.predictions || data.history || data || [];
      if (Array.isArray(items)) {
        if (sortOrder === 'oldest') items = [...items].reverse();
        setPredictions(items);
      }
      setTotalPages(data.total_pages || Math.ceil((data.total || items.length) / perPage) || 1);
    } catch {
      setError('Failed to load prediction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filter, search, sortOrder]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction?')) return;
    setDeletingId(id);
    try {
      await deleteHistory(id);
      setPredictions((p) => p.filter((x) => x.id !== id));
    } catch {
      alert('Failed to delete prediction.');
    } finally {
      setDeletingId(null);
    }
  };

  const filters = [
    { label: 'All', value: '' },
    { label: 'Tumor', value: 'Tumor' },
    { label: 'No Tumor', value: 'No Tumor' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#0c2340] mb-2">Prediction History</h1>
      <p className="text-gray-500 mb-6">View and manage all your past MRI scan analyses.</p>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search predictions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-[#1e3a5f] border border-gray-300 hover:border-cyan-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[#1e3a5f] hover:border-cyan-400 transition-all"
        >
          {sortOrder === 'newest' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-cyan-600 animate-spin" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-20">
          <FileX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No predictions found</p>
          <p className="text-gray-400 text-sm mt-1">Start by analyzing an MRI scan</p>
          <Link to="/predict" className="inline-block mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all">
            Analyze MRI
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.map((p) => {
              const isTumor = p.predicted_class === 'Tumor';
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="h-48 bg-gray-100 relative">
                    <img
                      src={`/uploads/${p.image_path?.split('/').pop()}`}
                      alt="MRI"
                      className="w-full h-full object-contain"
                    />
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                      isTumor ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {p.predicted_class}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-gray-500">
                      Probability: <span className="font-semibold text-[#0c2340]">{(p.prediction_probability * 100).toFixed(1)}%</span>
                    </p>
                    <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
                    <div className="flex gap-2 pt-2">
                      <Link
                        to={`/results/${p.id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-cyan-50 text-cyan-600 rounded-lg text-sm font-medium hover:bg-cyan-100 transition-colors"
                      >
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:border-cyan-400 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:border-cyan-400 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
