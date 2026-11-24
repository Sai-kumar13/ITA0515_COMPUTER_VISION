import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, Brain, ShieldCheck, Download, Loader2, AlertCircle,
} from 'lucide-react';

const COLORS = ['#ef4444', '#10b981'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const d = await getAnalytics();
        setData(d);
      } catch {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportCSV = () => {
    if (!data?.predictions && !data?.history) return;
    const rows = data.predictions || data.history || [];
    const header = 'ID,Predicted Class,Probability,Processing Time,Date\n';
    const csv = header + rows.map((r) =>
      `${r.id},"${r.predicted_class}",${r.prediction_probability},${r.processing_time},"${r.created_at}"`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brain_scan_analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-6 w-6" /> {error}
        </div>
      </div>
    );
  }

  const totalPredictions = data.total_predictions ?? 0;
  const tumorCount = data.tumor_count ?? 0;
  const noTumorCount = data.no_tumor_count ?? 0;

  const pieData = [
    { name: 'Tumor', value: tumorCount },
    { name: 'No Tumor', value: noTumorCount },
  ].filter((d) => d.value > 0);

  const monthlyData = data.monthly_data || [];
  const predictions = data.predictions || data.history || [];

  const stats = [
    { label: 'Total Analyses', value: totalPredictions, icon: Activity, color: 'text-cyan-600', border: 'border-cyan-500' },
    { label: 'Tumor Detected', value: tumorCount, icon: Brain, color: 'text-red-600', border: 'border-red-500' },
    { label: 'No Tumor', value: noTumorCount, icon: ShieldCheck, color: 'text-green-600', border: 'border-green-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0c2340]">Analytics</h1>
          <p className="text-gray-500 mt-1">Detailed insights into your brain scan analyses.</p>
        </div>
        <button
          onClick={exportCSV}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all duration-300"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${s.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color} mt-1`}>{s.value}</p>
              </div>
              <s.icon className={`h-10 w-10 ${s.color} opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pie */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Prediction Distribution</h2>
          {pieData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-16">No data available yet.</p>
          )}
        </div>

        {/* Bar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Monthly Analysis</h2>
          {monthlyData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-16">No monthly data available yet.</p>
          )}
        </div>
      </div>

      {/* Table */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Prediction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Result</th>
                  <th className="pb-3 font-medium">Probability</th>
                  <th className="pb-3 font-medium">Processing Time</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-gray-600">{i + 1}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.predicted_class === 'Tumor' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {p.predicted_class}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{(p.prediction_probability * 100).toFixed(1)}%</td>
                    <td className="py-3 text-gray-600">{p.processing_time?.toFixed(2) || '—'}s</td>
                    <td className="py-3 text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
