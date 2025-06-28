import { useState, useEffect } from 'react';
import { X, Search, BarChart3, PieChart, MessageCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService, PredictionResult } from '../services/api';
import { AiAssistantChat } from './ui/AiAssistantChat';

interface ProviderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  prediction: PredictionResult | null;
}

interface ProviderData {
  Provider: string;
  Total_Reimbursed: number;
  Mean_Reimbursed: number;
  Claim_Count: number;
  Unique_Beneficiaries: number;
  Avg_Age: number;
  Pct_Male: number;
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
}

export function ProviderDetailsModal({ isOpen, onClose, providerName, prediction }: ProviderDetailsModalProps) {
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prediction' | 'dashboard' | 'chatbot'>('prediction');
  const [explanations, setExplanations] = useState<any>(null);
  const [explanationsLoading, setExplanationsLoading] = useState(false);
  const [explanationsError, setExplanationsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && providerName) {
      fetchProviderDetails();
      fetchExplanations();
    }
  }, [isOpen, providerName]);

  const fetchProviderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getProviderDetails(providerName);
      if (response.success) {
        setProviderData(response.provider);
      } else {
        setError('Failed to load provider details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading provider details');
    } finally {
      setLoading(false);
    }
  };

  const fetchExplanations = async () => {
    setExplanationsLoading(true);
    setExplanationsError(null);
    try {
      const response = await apiService.compareExplanations(providerName);
      if (response.success) {
        setExplanations(response.comparison);
      } else {
        setExplanationsError('Failed to load explanations');
      }
    } catch (err) {
      setExplanationsError(err instanceof Error ? err.message : 'Error loading explanations');
    } finally {
      setExplanationsLoading(false);
    }
  };

  const getChronicConditions = () => {
    if (!providerData) return [];

    const conditionsMap = {
      'Cancer': 'Cancer',
      'Stroke': 'Stroke',
      'Diabetes': 'Diabetes',
      'Heartfailure': 'Heart Failure',
      'Alzheimer': 'Alzheimer',
      'Depression': 'Depression',
      'IschemicHeart': 'IschemicHeart',
      'Osteoporasis': 'Osteoporosis',
      'Arthritis': 'Arthritis',
      'ObstrPulmonary': 'PulmonaryDisease',
      'RenalDisease': 'Kidney Disease',
    };

    const data = Object.keys(conditionsMap).map(key => {
      const name = conditionsMap[key];
      const value = providerData[key];
      return { name, value };
    }).filter(item => typeof item.value === 'number' && !isNaN(item.value));

    return data;
  };

  const getGenderData = () => {
    if (!providerData) return [];
    
    const malePct = providerData.Pct_Male * 100;
    const femalePct = (1 - providerData.Pct_Male) * 100;
    
    return [
      { name: 'Male', value: malePct, fill: '#3B82F6' },
      { name: 'Female', value: femalePct, fill: '#EC4899' }
    ];
  };


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col" style={{height: '90vh'}}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Provider Analysis</h2>
              <p className="text-sm text-gray-600">{providerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('prediction')}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'prediction'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Prediction Results</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chatbot'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading provider details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Prediction Results Tab */}
              {activeTab === 'prediction' && prediction && (
                <div className="space-y-6">
                  <div className={`border rounded-lg p-6 ${
                    prediction.Prediccion === 1 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Fraud Detection Result</h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        prediction.Prediccion === 1
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {prediction.Prediccion === 1 ? 'FRAUD DETECTED' : 'NO FRAUD'}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Fraud Probability</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {(prediction.Probabilidad_Fraude * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Risk Level</p>
                        <p className={`text-lg font-semibold ${
                          prediction.Probabilidad_Fraude > 0.7 ? 'text-red-600' :
                          prediction.Probabilidad_Fraude > 0.5 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {prediction.Probabilidad_Fraude > 0.7 ? 'High Risk' :
                           prediction.Probabilidad_Fraude > 0.5 ? 'Medium Risk' : 'Low Risk'}
                        </p>
                      </div>
                    </div>

                    {/* Probability Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            prediction.Probabilidad_Fraude > 0.5 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${prediction.Probabilidad_Fraude * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  {/* Interpretability Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                      Model Interpretability (LIME & SHAP)
                    </h3>
                    {explanationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-gray-600">Loading explanations...</span>
                      </div>
                    ) : explanationsError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <span className="text-red-700">{explanationsError}</span>
                        </div>
                      </div>
                    ) : explanations ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* LIME Explanation */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                          <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-green-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-green-900">LIME Explanation</h4>
                          </div>
                          <p className="text-sm text-green-700 mb-4">
                            Local Interpretable Model-agnostic Explanations show how each feature contributed to this specific prediction.
                          </p>
                          {explanations.lime_explanation?.feature_contributions?.length > 0 ? (
                            <div className="space-y-3">
                              {explanations.lime_explanation.feature_contributions.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-900 text-sm">{item.feature}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.impact === 'positive' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {item.impact === 'positive' ? '↑ Positive' : '↓ Negative'}
                                      </span>
                                      <span className="text-xs text-gray-500 font-mono">
                                        {item.weight.toFixed(3)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">Value: {item.value.toLocaleString()}</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          item.impact === 'positive' ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        style={{ 
                                          width: `${Math.min(Math.abs(item.weight) * 100, 100)}%`,
                                          maxWidth: '100%'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No LIME explanation available</p>
                            </div>
                          )}
                        </div>

                        {/* SHAP Explanation */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                          <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-blue-900">SHAP Explanation</h4>
                          </div>
                          <p className="text-sm text-blue-700 mb-4">
                            SHapley Additive exPlanations show the exact contribution of each feature to the prediction.
                          </p>
                          {explanations.shap_explanation?.feature_contributions?.length > 0 ? (
                            <div className="space-y-3">
                              {explanations.shap_explanation.feature_contributions.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-900 text-sm">{item.feature}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.impact === 'positive' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {item.impact === 'positive' ? '↑ Positive' : '↓ Negative'}
                                      </span>
                                      <span className="text-xs text-gray-500 font-mono">
                                        {item.shap_value?.toFixed(3) ?? 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">Value: {item.value.toLocaleString()}</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          item.impact === 'positive' ? 'bg-blue-500' : 'bg-red-500'
                                        }`}
                                        style={{ 
                                          width: `${Math.min(Math.abs(item.shap_value || 0) * 100, 100)}%`,
                                          maxWidth: '100%'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No SHAP explanation available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && providerData && (
                <div className="space-y-8">
                  {/* Key Metrics */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Total Reimbursed</h4>
                      <p className="text-2xl font-bold text-blue-700">
                        ${providerData.Total_Reimbursed.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-1">Unique Beneficiaries</h4>
                      <p className="text-2xl font-bold text-green-700">
                        {providerData.Unique_Beneficiaries.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-900 mb-1">Average Age</h4>
                      <p className="text-2xl font-bold text-purple-700">
                        {providerData.Avg_Age?.toFixed(1) || 'N/A'} years
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-orange-900 mb-1">Claim Count</h4>
                      <p className="text-2xl font-bold text-orange-700">
                        {providerData.Claim_Count.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
                    {/* Chronic Conditions Chart */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Chronic Conditions Prevalence</h4>
                      {(() => {
                          const chronicConditionsData = getChronicConditions();
                          const maxVal = chronicConditionsData.length > 0 
                                         ? Math.max(...chronicConditionsData.map(item => item.value)) 
                                         : 0; 
                          const domainMax = maxVal > 0 ? maxVal * 1.1 : 1; // Asegura un dominio positivo si maxVal es 0 o menos

                          return (
                              <ResponsiveContainer width="100%" height={500}>
                                  <BarChart data={chronicConditionsData}> {/* layout="vertical" es el predeterminado */}
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis 
                                          dataKey="name" 
                                          type="category" 
                                          angle={-45} // Rotar etiquetas
                                          textAnchor="end" // Anclar texto al final para la rotación
                                          interval={0} // Mostrar todas las etiquetas
                                          height={100} // Dar más espacio para las etiquetas rotadas
                                      />
                                      <YAxis 
                                          type="number" 
                                          domain={[0, domainMax]} 
                                          tickFormatter={(value) => Number(value).toFixed(2)}
                                      />
                                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'Prevalence']} />
                                      <Bar dataKey="value" fill="#82ca9d" />
                                  </BarChart>
                              </ResponsiveContainer>
                          );
                      })()}
                    </div>

                    {/* Gender Distribution Chart */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center" style={{ height: 600 }}>
                        <div className="flex items-center justify-center w-full" style={{ flex: 0.5 }}>
                            <h4 className="text-lg font-semibold text-gray-900 mb-0">Gender Distribution</h4>
                        </div>
                        <div className="flex items-center justify-center w-full" style={{ flex: 3 }}>
                            <RechartsPieChart width={240} height={500}>
                            <Pie
                                data={getGenderData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {getGenderData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            </RechartsPieChart>
                        </div>
                        </div>
                    </div>
                  </div>
              )}

              {/* Chatbot Tab */}
              {activeTab === 'chatbot' && (
                <AiAssistantChat
                  styleVariant="card"
                  context={{ 
                    provider: providerData, 
                    prediction,
                    explanations,
                    dashboard: {
                      provider: providerData,
                      chronicConditions: getChronicConditions(),
                      genderData: getGenderData(),
                      keyMetrics: {
                        totalReimbursed: providerData?.Total_Reimbursed,
                        meanReimbursed: providerData?.Mean_Reimbursed,
                        claimCount: providerData?.Claim_Count,
                        uniqueBeneficiaries: providerData?.Unique_Beneficiaries,
                        avgAge: providerData?.Avg_Age,
                        pctMale: providerData?.Pct_Male
                      }
                    }
                  }}
                  suggestedQuestions={
                    prediction && prediction.Prediccion === 1
                      ? [
                          '¿Por qué el modelo marcó este proveedor como posible fraude?',
                          '¿Qué patrones sugieren actividad sospechosa?',
                          '¿Qué métricas específicas contribuyeron más?',
                          '¿Cómo se compara este proveedor con otros?',
                          '¿Qué nos dicen las explicaciones SHAP y LIME?',
                          '¿Qué condiciones crónicas son más relevantes?'
                        ]
                      : [
                          '¿Por qué el modelo considera que este proveedor no es fraudulento?',
                          '¿Qué patrones sugieren actividad normal?',
                          '¿Qué métricas contribuyeron a la clasificación como no fraude?',
                          '¿Cómo se compara este proveedor con otros?',
                          '¿Qué nos dicen las explicaciones SHAP y LIME?',
                          '¿Qué condiciones crónicas son más relevantes?'
                        ]
                  }
                  title="AI Assistant"
                  description="This assistant analyzes fraud results and provides intelligent insights about this provider."
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
