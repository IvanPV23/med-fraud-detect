import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, FileText, Upload, BarChart3, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home', icon: Shield },
    { to: '/model-overview', label: 'Model Overview', icon: BarChart3 },
    { to: '/bulk-input', label: 'Bulk Upload', icon: Upload },
    { to: '/single-prediction', label: 'Single Prediction', icon: FileText },
    { to: '/ai-assistant', label: 'AI Assistant', icon: MessageCircle },
  ];

  return (
    <nav className="bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FraudGuard</h1>
                <p className="text-sm text-gray-600">Healthcare Protection</p>
              </div>
            </Link>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-blue-100 text-blue-700 shadow-sm" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="text-gray-600 hover:text-blue-600 p-2">
              <Activity className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <div className="md:hidden bg-white border-t border-blue-100">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium",
                  isActive 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
