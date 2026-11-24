import { Link } from 'react-router-dom';
import {
  Brain, Upload, Cpu, BarChart3, FileCheck,
  Zap, Eye, History, LayoutDashboard, Shield, AlertTriangle,
  ArrowRight, ChevronRight,
} from 'lucide-react';

const steps = [
  { icon: Upload, title: 'Upload MRI', desc: 'Upload a brain MRI scan image in JPG or PNG format.' },
  { icon: Cpu, title: 'AI Processing', desc: 'Our deep learning model preprocesses and analyzes the image.' },
  { icon: Brain, title: 'CNN Classification', desc: 'A trained CNN classifies the scan as Tumor or No Tumor.' },
  { icon: FileCheck, title: 'Get Results', desc: 'View prediction results with Grad-CAM visualization.' },
];

const features = [
  { icon: Zap, title: 'Real-time Detection', desc: 'Get instant predictions from our trained CNN model with sub-second processing.', color: 'text-amber-500' },
  { icon: Brain, title: 'CNN Architecture', desc: 'Custom Convolutional Neural Network designed for brain MRI classification.', color: 'text-cyan-500' },
  { icon: Eye, title: 'Grad-CAM Visualization', desc: 'See which regions of the MRI the model focuses on for its decision.', color: 'text-purple-500' },
  { icon: History, title: 'Prediction History', desc: 'Track and review all your past predictions with full details.', color: 'text-green-500' },
  { icon: LayoutDashboard, title: 'Analytics Dashboard', desc: 'Comprehensive analytics with charts, stats and export options.', color: 'text-sky-500' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your medical data stays secure with authentication and private storage.', color: 'text-red-500' },
];

const tech = [
  'Python', 'Flask', 'TensorFlow / Keras', 'OpenCV', 'React', 'Tailwind CSS', 'Vite',
  'SQLite', 'JWT Auth', 'Recharts', 'Grad-CAM', 'REST API',
];

export default function HomePage() {
  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#e0f2fe] to-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-cyan-100 rounded-full">
              <Brain className="h-16 w-16 text-cyan-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0c2340] mb-4 leading-tight">
            Brain Tumor Detection<br />Using MRI Images
          </h1>
          <p className="text-lg text-cyan-700 font-medium mb-3">
            AI-Powered Brain MRI Classification Using Deep Learning
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Upload a brain MRI scan and receive an instant AI-powered classification.
            Our Convolutional Neural Network analyzes the image and provides a prediction
            along with Grad-CAM heatmap visualization showing which regions influenced the decision.
          </p>
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0c2340] text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-all duration-300 relative">
                <div className="absolute -top-3 -left-3 h-8 w-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <s.icon className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#0c2340] mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0c2340] text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-[#f0f9ff] rounded-xl p-6 hover:shadow-md transition-all duration-300 border border-transparent hover:border-cyan-200">
                <f.icon className={`h-10 w-10 ${f.color} mb-4`} />
                <h3 className="text-lg font-semibold text-[#0c2340] mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0c2340] text-center mb-8">Technology Stack</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {tech.map((t) => (
              <span
                key={t}
                className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-[#1e3a5f] text-sm font-medium hover:border-cyan-300 hover:shadow-md transition-all duration-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">Medical Disclaimer</h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                This application is developed for educational and research purposes only.
                It should not be used as a substitute for professional medical advice, diagnosis,
                or treatment. The predictions made by this model have not been validated for clinical use.
                Always seek the advice of a qualified healthcare provider with any questions regarding
                a medical condition.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
