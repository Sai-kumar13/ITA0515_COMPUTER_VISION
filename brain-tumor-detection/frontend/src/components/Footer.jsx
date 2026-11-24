import { Link } from 'react-router-dom';
import { Brain, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0c2340] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-7 w-7 text-cyan-400" />
              <span className="text-xl font-bold text-white">BrainScan AI</span>
            </div>
            <p className="text-sm leading-relaxed">
              AI-powered brain tumor detection using deep learning and MRI image analysis.
              A capstone project demonstrating modern computer vision techniques.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                ['/', 'Home'],
                ['/predict', 'Analyze MRI'],
                ['/about', 'About Project'],
                ['/model-performance', 'Model Performance'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-cyan-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Medical Disclaimer
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              This tool is for educational and research purposes only. It is not a substitute for
              professional medical advice, diagnosis, or treatment. Always consult a qualified
              healthcare provider for medical decisions.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} BrainScan AI — CV Capstone Project. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
