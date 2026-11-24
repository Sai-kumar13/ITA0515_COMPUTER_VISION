import {
  Brain, Database, Cpu, Eye, Target, Cog, Monitor,
  AlertTriangle, ChevronRight,
} from 'lucide-react';

const modules = [
  {
    icon: Database,
    title: 'Module 1: MRI Image Preprocessing & Dataset Preparation',
    items: [
      'Dataset collection and organization (Tumor / No Tumor classes)',
      'Image resizing to 224×224 pixels',
      'Pixel normalization to [0, 1] range',
      'Data augmentation for improved generalization',
      'Train/validation/test split',
    ],
  },
  {
    icon: Cpu,
    title: 'Module 2: Brain Tumor Detection & Classification Using CNN',
    items: [
      'Custom CNN architecture with multiple convolutional layers',
      'ReLU activation and max pooling layers',
      'Dropout regularization to prevent overfitting',
      'Binary classification (Tumor vs No Tumor)',
      'Sigmoid output with probability score',
    ],
  },
  {
    icon: Eye,
    title: 'Module 3: Tumor Localization & Result Visualization (Grad-CAM)',
    items: [
      'Gradient-weighted Class Activation Mapping (Grad-CAM)',
      'Visual explanation of CNN decisions',
      'Heatmap overlay on original MRI images',
      'Identification of tumor-suspected regions',
      'Enhanced interpretability for medical professionals',
    ],
  },
];

const objectives = [
  'Develop an automated brain tumor detection system using deep learning',
  'Implement a CNN model for binary classification of brain MRI images',
  'Generate Grad-CAM visualizations for model interpretability',
  'Build a full-stack web application for accessible MRI analysis',
  'Provide prediction history, analytics, and export capabilities',
];

const technologies = [
  { name: 'Python', desc: 'Core programming language' },
  { name: 'TensorFlow / Keras', desc: 'Deep learning framework' },
  { name: 'OpenCV', desc: 'Image processing' },
  { name: 'Flask', desc: 'Backend REST API' },
  { name: 'React', desc: 'Frontend UI framework' },
  { name: 'Tailwind CSS', desc: 'Utility-first styling' },
  { name: 'SQLite', desc: 'Database for users & predictions' },
  { name: 'JWT', desc: 'Authentication tokens' },
  { name: 'Recharts', desc: 'Data visualization' },
  { name: 'Vite', desc: 'Frontend build tool' },
];

const limitations = [
  'Binary classification only (Tumor vs No Tumor) — no multi-class support',
  'Model accuracy depends on training data quality and quantity',
  'Not validated for clinical or diagnostic use',
  'Performance may vary on MRI images from different scanners or protocols',
  'Grad-CAM visualization is an approximation and may not precisely localize tumors',
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Overview */}
      <section className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-cyan-100 rounded-full">
            <Brain className="h-12 w-12 text-cyan-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-[#0c2340] mb-3">About This Project</h1>
        <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
          This capstone project demonstrates the application of Convolutional Neural Networks (CNNs)
          for automated brain tumor detection using MRI images. The system combines deep learning-based
          image classification with Grad-CAM visualization to provide interpretable results through a
          modern web interface.
        </p>
      </section>

      {/* Modules */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#0c2340] mb-6">Project Modules</h2>
        <div className="space-y-6">
          {modules.map((m, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <m.icon className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#0c2340]">{m.title}</h3>
              </div>
              <ul className="space-y-2 pl-2">
                {m.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-600 text-sm">
                    <ChevronRight className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Objectives */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#0c2340] mb-6">Objectives</h2>
        <div className="bg-white rounded-xl shadow-md p-6">
          <ul className="space-y-3">
            {objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-600">
                <Target className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Methodology / System Architecture */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#0c2340] mb-6">System Architecture</h2>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="h-6 w-6 text-cyan-600" />
            <h3 className="text-lg font-semibold text-[#0c2340]">End-to-End Pipeline</h3>
          </div>
          <div className="bg-[#f0f9ff] rounded-lg p-6 text-sm text-[#1e3a5f] font-mono leading-loose">
            <p>User uploads MRI image via React frontend</p>
            <p className="pl-4">→ Image sent to Flask REST API (POST /api/predict)</p>
            <p className="pl-8">→ Image validated and preprocessed (resize 224×224, normalize)</p>
            <p className="pl-12">→ Preprocessed image passed to trained CNN model</p>
            <p className="pl-16">→ CNN outputs prediction (Tumor / No Tumor) with probability</p>
            <p className="pl-16">→ Grad-CAM generates heatmap visualization</p>
            <p className="pl-12">→ Results saved to SQLite database</p>
            <p className="pl-8">→ Response returned with prediction + Grad-CAM image</p>
            <p className="pl-4">→ React frontend displays results with interactive charts</p>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#0c2340] mb-6">Technologies Used</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {technologies.map((t) => (
            <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2">
                <Cog className="h-4 w-4 text-cyan-500" />
                <span className="font-semibold text-[#0c2340]">{t.name}</span>
              </div>
              <p className="text-gray-500 text-sm mt-1 pl-6">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Limitations */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-[#0c2340] mb-6">Limitations</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-amber-800">Important Limitations</h3>
          </div>
          <ul className="space-y-2">
            {limitations.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-amber-700 text-sm">
                <span className="text-amber-400 mt-0.5">•</span>
                {l}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
