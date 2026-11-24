import { useState, useEffect } from 'react';
import { getModelInfo } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Brain, Target, Crosshair, BarChart3, TrendingUp,
  Loader2, AlertCircle, Info,
} from 'lucide-react';

export default function ModelPerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const d = await getModelInfo();
        setData(d);
      } catch {
        setError('Failed to load model information.');
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
          <AlertCircle className="h-6 w-6" /> {error}
        </div>
      </div>
    );
  }

  const hasEval = data?.evaluation || data?.metrics;
  const hasHistory = data?.training_history || data?.history;

  if (!hasEval && !hasHistory && !data?.model_loaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
        <h1 className="text-3xl font-bold text-[#0c2340] mb-6">Model Performance</h1>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-8 text-center">
          <Info className="h-12 w-12 text-sky-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#0c2340] mb-2">Model Not Trained Yet</h2>
          <p className="text-gray-600 mb-4">
            The CNN model has not been trained or no evaluation data is available.
          </p>
          <div className="bg-white rounded-lg p-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-[#0c2340] mb-3">To train the model:</h3>
            <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
              <li>Prepare the brain MRI dataset in the data/ directory</li>
              <li>Run the training script: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">python train_model.py</code></li>
              <li>The model will be saved to models/brain_tumor_cnn.keras</li>
              <li>Evaluation metrics will be available after training</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const evaluation = data.evaluation || data.metrics || {};
  const metrics = [
    { label: 'Accuracy', value: evaluation.accuracy, icon: Target, color: 'text-cyan-600', border: 'border-cyan-500' },
    { label: 'Precision', value: evaluation.precision, icon: Crosshair, color: 'text-sky-600', border: 'border-sky-500' },
    { label: 'Recall', value: evaluation.recall, icon: TrendingUp, color: 'text-green-600', border: 'border-green-500' },
    { label: 'F1-Score', value: evaluation.f1_score, icon: BarChart3, color: 'text-indigo-600', border: 'border-indigo-500' },
  ];

  const confusionMatrix = evaluation.confusion_matrix;

  const history = data.training_history || data.history;
  let accData = [];
  let lossData = [];
  if (history) {
    const epochs = history.accuracy?.length || history.loss?.length || 0;
    for (let i = 0; i < epochs; i++) {
      accData.push({
        epoch: i + 1,
        'Train Accuracy': history.accuracy?.[i],
        'Val Accuracy': history.val_accuracy?.[i],
      });
      lossData.push({
        epoch: i + 1,
        'Train Loss': history.loss?.[i],
        'Val Loss': history.val_loss?.[i],
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#0c2340] mb-2">Model Performance</h1>
      <p className="text-gray-500 mb-8">Evaluation metrics and training history of the brain tumor CNN model.</p>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${m.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{m.label}</p>
                <p className={`text-3xl font-bold ${m.color} mt-1`}>
                  {m.value != null ? `${(m.value * 100).toFixed(1)}%` : '—'}
                </p>
              </div>
              <m.icon className={`h-10 w-10 ${m.color} opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Confusion Matrix */}
      {confusionMatrix && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Confusion Matrix</h2>
          <div className="overflow-x-auto">
            <table className="mx-auto text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-3"></th>
                  <th className="p-3 font-semibold text-[#0c2340] bg-green-50 rounded-tl-lg">Pred: No Tumor</th>
                  <th className="p-3 font-semibold text-[#0c2340] bg-red-50 rounded-tr-lg">Pred: Tumor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 font-semibold text-[#0c2340] bg-green-50 rounded-tl-lg">Actual: No Tumor</td>
                  <td className="p-3 bg-green-100 font-bold text-green-700 text-xl">{confusionMatrix[0]?.[0] ?? '—'}</td>
                  <td className="p-3 bg-red-50 font-bold text-red-400 text-xl">{confusionMatrix[0]?.[1] ?? '—'}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#0c2340] bg-red-50 rounded-bl-lg">Actual: Tumor</td>
                  <td className="p-3 bg-red-50 font-bold text-red-400 text-xl">{confusionMatrix[1]?.[0] ?? '—'}</td>
                  <td className="p-3 bg-green-100 font-bold text-green-700 text-xl">{confusionMatrix[1]?.[1] ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Training Charts */}
      {accData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Training / Validation Accuracy</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(v) => `${(v * 100).toFixed(2)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="Train Accuracy" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Val Accuracy" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#0c2340] mb-4">Training / Validation Loss</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip formatter={(v) => v?.toFixed(4)} />
                  <Legend />
                  <Line type="monotone" dataKey="Train Loss" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Val Loss" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
