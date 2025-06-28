import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white border-t border-blue-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Minimal & Attractive AI Assistant Button Section */}
        <div className="flex items-center justify-center mb-4">
          <Link
            to="/ai-assistant"
            className="flex flex-col items-center px-5 py-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-100 rounded-xl shadow-sm transition-colors duration-150 text-gray-800 min-w-[220px]"
            aria-label="Go to AI Assistant"
          >
            <div className="flex items-center space-x-2 mb-1">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-base">Need help? Ask the AI Assistant</span>
            </div>
            <span className="text-xs text-gray-500">Get answers about medical fraud detection</span>
          </Link>
        </div>

        {/* Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600">
              © 2025 FraudGuard Healthcare Protection. Advanced ML-powered fraud detection system.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Protecting healthcare integrity through intelligent analytics
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>System Active</span>
            </span>
            <span>Version 2.1.0</span>
            <span>Last Updated: Jun 2025</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Animación fade-in sugerida en tu CSS global:
// .animate-fade-in { animation: fadeIn 0.7s ease; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
