import { MessageCircle, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-blue-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Chat Assistant Section */}
        <div className="flex items-center justify-center bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3 text-gray-700">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Need help? Chat with the audit assistant!</p>
              <p className="text-sm text-gray-600">Coming soon - AI-powered fraud detection support</p>
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Coming Soon</span>
            </div>
          </div>
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
