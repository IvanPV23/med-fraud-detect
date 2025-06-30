import { Link } from 'react-router-dom';
import { Shield, BarChart3, Upload, FileText, ChevronRight, Activity, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { AiAssistantChat } from '../ui/AiAssistantChat';

export function HomePage() {
  const features = [
    {
      icon: BarChart3,
      title: "Model Overview & Metrics",
      description: "View comprehensive ML model performance metrics, ROC curves, and accuracy statistics",
      to: "/model-overview",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Upload,
      title: "Bulk Input (CSV Upload)",
      description: "Upload multiple provider records for batch fraud detection analysis",
      to: "/bulk-input",
      color: "from-green-500 to-green-600"
    },
    {
      icon: FileText,
      title: "Single Prediction Form",
      description: "Analyze individual healthcare providers with detailed risk assessment",
      to: "/single-prediction",
      color: "from-purple-500 to-purple-600"
    }
  ];

  const stats = [
    { label: "Claims Analyzed", value: "5k+", icon: Activity },
    { label: "Providers Monitored", value: "1353", icon: Users },
    { label: "Fraud Detected", value: "$12.8M", icon: DollarSign },
    { label: "Recall Rate", value: "75.6%", icon: Shield }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 rounded-2xl mb-12">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: 'url(/images/hero-background.jpg)' }}
        ></div>
        <div className="relative px-8 py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Advanced Healthcare
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-300">
                Fraud Detection
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              ML-powered system protecting healthcare integrity through intelligent analytics and real-time fraud detection
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/single-prediction"
                className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>Start Analysis</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/model-overview"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-colors duration-200"
              >
                View Performance
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Features Section */}
      <div className="mb-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Fraud Detection Tools
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Leverage advanced machine learning capabilities to identify suspicious healthcare provider activities and protect against fraudulent claims
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.to}
                className="group bg-white rounded-xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  <span>Get Started</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">Secure & Compliant</h3>
            <p className="text-amber-800 leading-relaxed">
              This system maintains the highest standards of data security and HIPAA compliance. All provider information is processed securely and no sensitive data is stored permanently on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
