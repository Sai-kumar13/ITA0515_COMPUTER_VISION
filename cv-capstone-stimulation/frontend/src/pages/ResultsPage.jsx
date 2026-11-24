import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHistoryItem } from '../services/api';
import {
  ArrowLeft, Brain, Clock, Calendar, AlertTriangle,
  CheckCircle, XCircle, Loader2, AlertCircle,
} from 'lucide-react';

export default function ResultsPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getHistoryItem(id);
        setResult(data.prediction || data);
      } catch {
        setError('Failed to load prediction details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          {error || 'Prediction not found.'}
        </div>
        <Link to="/history" className="inline-flex items-center gap-2 mt-4 text-cyan-600 hover:text-cyan-700">
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Link>
      </div>
    );
  }

  const isTumor = result.predicted_class === 'Tumor';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      <Link to="/history" className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to History
      </Link>

      <h1 className="text-3xl font-bold text-[#0c2340] mb-6">Prediction Details</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-[#0c2340] mb-4">MRI Image</h2>
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <img
              src={`/uploads/${result.image_path?.split('/').pop()}`}
              alt="Brain MRI"
              className="w-full h-72 object-contain"
            />
          </div>
        </div>

        {/* Result details */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <div className={`flex items-center gap-3 p-4 rounded-xl ${isTumor ? 'bg-red-50' : 'bg-green-50'}`}>
            {isTumor ? (
              <XCircle className="h-8 w-8 text-red-500" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-500" />
            )}
            <div>
              <p className="text-sm text-gray-500">Classification Result</p>
              <p className={`text-2xl font-bold ${isTumor ? 'text-red-600' : 'text-green-600'}`}>
                {result.predicted_class}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Prediction Probability</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${isTumor ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${(result.prediction_probability * 100).toFixed(1)}%` }}
                />
              </div>
              <span className="font-bold text-[#0c2340]">{(result.prediction_probability * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />Processing Time</p>
              <p className="text-lg font-bold text-[#0c2340]">{result.processing_time?.toFixed(2) || '—'}s</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />Date</p>
              <p className="text-sm font-medium text-[#0c2340]">{new Date(result.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grad-CAM */}
      {result.grad_cam_path && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-600" />
            Grad-CAM Visualization
          </h2>
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <img
              src={`/gradcam/${result.grad_cam_path.split('/').pop()}`}
              alt="Grad-CAM"
              className="w-full object-contain max-h-96"
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            The Grad-CAM heatmap shows which regions of the MRI image the CNN model focused on to make its classification decision.
          </p>
        </div>
      )}


    </div>
  );
}
