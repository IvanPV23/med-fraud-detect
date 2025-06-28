import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, AlertTriangle, ChevronDown } from 'lucide-react';
import { apiService } from '../services/api';

interface DashboardData {
  Provider: string;
  Total_Reimbursed: number;
  Mean_Reimbursed: number;
  Claim_Count: number;
  Unique_Beneficiaries: number;
  Alzheimer: number;
  Heartfailure: number;
  Cancer: number;
  ObstrPulmonary: number;
  Depression: number;
  Diabetes: number;
  IschemicHeart: number;
  Osteoporasis: number;
  Arthritis: number;
  Stroke: number;
  RenalDisease: number;
  Avg_Age: number;
  Pct_Male: number;
  [key: string]: any;
}

interface PredictionResult {
  Provider: string;
  Prediccion: number;
  Probabilidad_Fraude: number;
}

interface InteractiveDashboardProps {
  predictions: PredictionResult[];
  isVisible: boolean;
}

export function InteractiveDashboard({ predictions, isVisible }: InteractiveDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topN, setTopN] = useState(5);
  const [sortBy, setSortBy] = useState<'reimbursed' | 'claims' | 'beneficiaries'>('reimbursed');

  useEffect(() => {
    if (isVisible) {
      fetchDashboardData();
    }
  }, [isVisible]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getDashboardData();
      let data: any = response.data;
      if (!Array.isArray(data) && Array.isArray(data.data)) {
        data = data.data;
      }
      setDashboardData(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard data');
      // Si no hay datos del backend, crear datos básicos desde las predicciones
      createBasicDashboardData();
    } finally {
      setLoading(false);
    }
  };

  const createBasicDashboardData = () => {
    // Crear datos básicos desde las predicciones si no hay datos del backend
    const basicData: DashboardData[] = predictions.map((pred, index) => ({
      Provider: pred.Provider,
      Total_Reimbursed: Math.random() * 1000000 + 50000, // Valores simulados
      Mean_Reimbursed: Math.random() * 50000 + 10000,
      Claim_Count: Math.floor(Math.random() * 1000) + 100,
      Unique_Beneficiaries: Math.floor(Math.random() * 500) + 50,
      Alzheimer: Math.random(),
      Heartfailure: Math.random(),
      Cancer: Math.random(),
      ObstrPulmonary: Math.random(),
      Depression: Math.random(),
      Diabetes: Math.random(),
      IschemicHeart: Math.random(),
      Osteoporasis: Math.random(),
      Arthritis: Math.random(),
      Stroke: Math.random(),
      RenalDisease: Math.random(),
      Avg_Age: Math.floor(Math.random() * 30) + 50,
      Pct_Male: Math.random() * 0.6 + 0.2
    }));
    setDashboardData(basicData);
  };

  const generateDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.generateDashboard();
      if (response.success) {
        await fetchDashboardData();
      } else {
        setError('Failed to generate dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTopProviders = () => {
    if (!dashboardData.length) return [];
    
    const sortedData = [...dashboardData].sort((a, b) => {
      switch (sortBy) {
        case 'reimbursed':
          return b.Total_Reimbursed - a.Total_Reimbursed;
        case 'claims':
          return b.Claim_Count - a.Claim_Count;
        case 'beneficiaries':
          return b.Unique_Beneficiaries - a.Unique_Beneficiaries;
        default:
          return 0;
      }
    });
    
    return sortedData.slice(0, topN);
  };

  const getTopFraudProviders = () => {
    if (!predictions.length) return [];
    
    const fraudProviders = predictions
      .filter(p => p.Prediccion === 1)
      .sort((a, b) => b.Probabilidad_Fraude - a.Probabilidad_Fraude)
      .slice(0, 3);
    
    return fraudProviders;
  };

  const calculateTotalSavings = () => {
    const fraudProviders = predictions.filter(p => p.Prediccion === 1);
    return fraudProviders.reduce((total, p) => {
      const providerData = dashboardData.find(d => d.Provider === p.Provider);
      return total + (providerData?.Total_Reimbursed || 0);
    }, 0);
  };

  const getSortByLabel = () => {
    switch (sortBy) {
      case 'reimbursed':
        return 'Most Reimbursed';
      case 'claims':
        return 'Most Claims';
      case 'beneficiaries':
        return 'Most Beneficiaries';
      default:
        return 'Sort by';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Interactive Dashboard</h3>
            <p className="text-sm text-gray-600">Analytics and insights from fraud detection</p>
          </div>
        </div>

        {!dashboardData.length && (
          <button
            onClick={generateDashboardData}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Dashboard Data'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Key Metrics</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h5 className="text-sm font-medium text-green-900">Total Savings</h5>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    ${calculateTotalSavings().toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">From detected fraud</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h5 className="text-sm font-medium text-blue-900">Providers Analyzed</h5>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {predictions.length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Total providers</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h5 className="text-sm font-medium text-red-900">Fraud Detected</h5>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {predictions.filter(p => p.Prediccion === 1).length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">High-risk providers</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h5 className="text-sm font-medium text-purple-900">Fraud Rate</h5>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {predictions.length > 0 ? ((predictions.filter(p => p.Prediccion === 1).length / predictions.length) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Of total providers</p>
                </div>
              </div>
            </div>

            {/* Top Fraud Providers */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Top 3 Fraud Providers</h4>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="space-y-3">
                  {getTopFraudProviders().map((provider, index) => (
                    <div key={provider.Provider} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-red-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{provider.Provider}</p>
                          <p className="text-sm text-gray-600">
                            {(provider.Probabilidad_Fraude * 100).toFixed(1)}% fraud probability
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${dashboardData.find(d => d.Provider === provider.Provider)?.Total_Reimbursed?.toLocaleString() || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">Total reimbursed</p>
                      </div>
                    </div>
                  ))}
                  {getTopFraudProviders().length === 0 && (
                    <p className="text-center text-gray-500 py-4">No fraud detected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Top Providers */}
          {dashboardData.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Top Providers Analysis</h4>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Show top:</label>
                    <select
                      value={topN}
                      onChange={(e) => setTopN(Number(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
                      >
                        <option value="reimbursed">Most Reimbursed</option>
                        <option value="claims">Most Claims</option>
                        <option value="beneficiaries">Most Beneficiaries</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Reimbursed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Beneficiaries</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getTopProviders().map((provider, index) => {
                        const prediction = predictions.find(p => p.Provider === provider.Provider);
                        return (
                          <tr key={provider.Provider} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {provider.Provider}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${provider.Total_Reimbursed.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {provider.Claim_Count.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {provider.Unique_Beneficiaries.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {prediction ? (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  prediction.Prediccion === 1
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                  }`}>
                                  {prediction.Prediccion === 1 ? 'FRAUD' : 'CLEAN'}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}