import { useState, useRef } from 'react';
import { predict as apiPredict } from '../services/api';
import {
  Upload, Image, Trash2, Brain, Clock, Calendar, AlertTriangle,
  Loader2, CheckCircle, XCircle, RefreshCw, Eye,
} from 'lucide-react';

export default function PredictPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(f.type)) {
      setError('Please upload a valid image file (JPG or PNG).');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10 MB.');
      return;
    }
    setError('');
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiPredict(file);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAnother = () => {
    removeFile();
  };

  const isTumor = result?.predicted_class === 'Tumor';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-3xl font-bold text-[#0c2340] mb-2">Analyze MRI Scan</h1>
      <p className="text-gray-500 mb-8">Upload a brain MRI image for AI-powered tumor detection.</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm max-w-2xl">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload area */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-cyan-600" />
            Upload MRI Image
          </h2>

          {!preview ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-cyan-400 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-1">Drag & drop your MRI image here</p>
              <p className="text-gray-400 text-sm mb-4">or click to browse files</p>
              <span className="inline-block px-4 py-2 bg-cyan-50 text-cyan-600 rounded-lg text-sm font-medium">
                Browse Files
              </span>
              <p className="text-gray-400 text-xs mt-3">Supports JPG, PNG — Max 10 MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img src={preview} alt="MRI Preview" className="w-full h-64 object-contain" />
                <button
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="w-full mt-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                Analyze MRI
              </>
            )}
          </button>
        </div>

        {/* Results area */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-[#0c2340] mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-cyan-600" />
            Analysis Results
          </h2>

          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Brain className="h-16 w-16 mb-4 opacity-30" />
              <p className="font-medium">No results yet</p>
              <p className="text-sm">Upload and analyze an MRI image to see results</p>
            </div>
          ) : (
            <div className="space-y-6 animate-slideUp">
              {/* Uploaded image */}
              {result.image_path && (
                <div className="rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={`/uploads/${result.image_path.split('/').pop()}`}
                    alt="Analyzed MRI"
                    className="w-full h-48 object-contain"
                  />
                </div>
              )}

              {/* Classification */}
              <div className={`flex items-center gap-3 p-4 rounded-xl ${isTumor ? 'bg-red-50' : 'bg-green-50'}`}>
                {isTumor ? (
                  <XCircle className="h-8 w-8 text-red-500" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                )}
                <div>
                  <p className="text-sm text-gray-500">Predicted Class</p>
                  <p className={`text-xl font-bold ${isTumor ? 'text-red-600' : 'text-green-600'}`}>
                    {result.predicted_class}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Probability</p>
                  <p className="text-lg font-bold text-[#0c2340]">
                    {(result.prediction_probability * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />Processing Time</p>
                  <p className="text-lg font-bold text-[#0c2340]">
                    {result.processing_time?.toFixed(2) || '—'}s
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />Date/Time</p>
                <p className="text-sm font-medium text-[#0c2340]">
                  {result.created_at ? new Date(result.created_at).toLocaleString() : new Date().toLocaleString()}
                </p>
              </div>

              {/* Grad-CAM */}
              {result.grad_cam_path && (
                <div>
                  <h3 className="text-lg font-semibold text-[#0c2340] mb-3">Grad-CAM Visualization</h3>
                  <div className="rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={`/gradcam/${result.grad_cam_path.split('/').pop()}`}
                      alt="Grad-CAM Visualization"
                      className="w-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    The heatmap highlights regions the model focused on for its prediction.
                  </p>
                </div>
              )}



              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyzeAnother}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#1e3a5f] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Analyze Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
