import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { getDashboard } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, Brain, ShieldCheck, AlertCircle, Plus, History, BarChart3, Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const d = await getDashboard();
        setData(d);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          <AlertCircle className="h-6 w-6" />
          {error}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Scans', value: data.total_predictions, icon: Activity, border: 'border-cyan-500', text: 'text-cyan-600' },
    { label: 'Tumor Detected', value: data.tumor_count, icon: Brain, border: 'border-red-500', text: 'text-red-600' },
    { label: 'No Tumor', value: data.no_tumor_count, icon: ShieldCheck, border: 'border-green-500', text: 'text-green-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#0c2340] mb-2">
        Welcome back, <span className="text-cyan-600">{user?.username}</span>
      </h1>
      <p className="text-gray-500 mb-8">Here's an overview of your brain scan analysis.</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${s.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold ${s.text} mt-1`}>{s.value}</p>
              </div>
              <s.icon className={`h-10 w-10 ${s.text} opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {data.monthly_data && data.monthly_data.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Prediction Activity</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent predictions */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Recent Predictions</h2>
        {data.recent_predictions && data.recent_predictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Result</th>
                  <th className="pb-3 font-medium">Probability</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_predictions.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.predicted_class === 'Tumor'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {p.predicted_class}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{(p.prediction_probability * 100).toFixed(1)}%</td>
                    <td className="py-3">
                      <Link to={`/results/${p.id}`} className="text-cyan-600 hover:text-cyan-700 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No predictions yet. Start by analyzing an MRI scan!</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/predict', icon: Plus, label: 'Analyze New MRI', bg: 'bg-cyan-600 hover:bg-cyan-700' },
          { to: '/history', icon: History, label: 'View History', bg: 'bg-sky-600 hover:bg-sky-700' },
          { to: '/analytics', icon: BarChart3, label: 'View Analytics', bg: 'bg-indigo-600 hover:bg-indigo-700' },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className={`flex items-center justify-center gap-2 px-6 py-3 ${a.bg} text-white rounded-lg font-medium transition-all duration-300`}
          >
            <a.icon className="h-5 w-5" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
