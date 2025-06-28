import { useState } from 'react';
import { User, Calculator, AlertTriangle, CheckCircle, X, Play, RefreshCw, MessageCircle, BarChart3 } from 'lucide-react';
import { apiService, SinglePredictionRequest, PredictionResult } from '../../services/api';
import { AiAssistantChat } from '../ui/AiAssistantChat';

interface PredictionForm {
  Provider: string;
  Total_Reimbursed: number;
  Claim_Count: number;
  Unique_Beneficiaries: number;
  Pct_Male: number;
}

export function SinglePredictionPage() {
  const [formData, setFormData] = useState<PredictionForm>({
    Provider: '',
    Total_Reimbursed: 0,
    Claim_Count: 0,
    Unique_Beneficiaries: 0,
    Pct_Male: 0.5
  });
  
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [calculatedMeanReimbursed, setCalculatedMeanReimbursed] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [limeExplanation, setLimeExplanation] = useState<any>(null);
  const [shapExplanation, setShapExplanation] = useState<any>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'result' | 'interpret' | 'chatbot'>('result');

  const handleInputChange = (field: keyof PredictionForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setPrediction(null);
    setCalculatedMeanReimbursed(null);
    setLimeExplanation(null);
    setShapExplanation(null);
    setExplanationError(null);
    setExplanationLoading(false);

    try {
      // Validar datos
      if (!formData.Provider.trim()) {
        throw new Error('Provider name is required');
      }

      if (formData.Claim_Count <= 0) {
        throw new Error('Claim Count must be greater than 0');
      }

      if (formData.Pct_Male < 0 || formData.Pct_Male > 1) {
        throw new Error('Pct_Male must be between 0 and 1');
      }

      if (formData.Total_Reimbursed < 0) {
        throw new Error('Total Reimbursed must be non-negative');
      }

      if (formData.Unique_Beneficiaries <= 0) {
        throw new Error('Unique Beneficiaries must be greater than 0');
      }

      // Preparar datos para la API
      const requestData: SinglePredictionRequest = {
        Provider: formData.Provider,
        Total_Reimbursed: formData.Total_Reimbursed,
        Claim_Count: formData.Claim_Count,
        Unique_Beneficiaries: formData.Unique_Beneficiaries,
        Pct_Male: formData.Pct_Male
      };

      // Llamar a la API de predicción individual
      const response = await apiService.predictSingle(requestData);
      
      if (!response.success) {
        throw new Error('Prediction failed');
      }

      setPrediction(response.prediction);
      setCalculatedMeanReimbursed(response.calculated_mean_reimbursed);
      setSuccessMessage('Prediction completed successfully!');

      // Cargar explicaciones LIME y SHAP
      setExplanationLoading(true);
      try {
        const limeResp = await apiService.explainLIME(requestData);
        setLimeExplanation(limeResp.explanation);
      } catch (limeErr) {
        setExplanationError('Error loading LIME explanation');
      }
      try {
        const shapResp = await apiService.explainSHAP(requestData);
        setShapExplanation(shapResp.explanation);
      } catch (shapErr) {
        setExplanationError('Error loading SHAP explanation');
      }
      setExplanationLoading(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during prediction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      Provider: '',
      Total_Reimbursed: 0,
      Claim_Count: 0,
      Unique_Beneficiaries: 0,
      Pct_Male: 0.5
    });
    setPrediction(null);
    setCalculatedMeanReimbursed(null);
    setError(null);
    setSuccessMessage(null);
    setLimeExplanation(null);
    setShapExplanation(null);
    setExplanationError(null);
    setExplanationLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Single Provider Prediction</h1>
            <p className="text-gray-600">Enter provider data for individual fraud detection analysis</p>
          </div>
        </div>
      </div>

      {/* Feature Information */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Model Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-purple-800 mb-2">Required Features:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Provider:</strong> Provider name (identifier)</li>
              <li>• <strong>Total_Reimbursed:</strong> Total amount reimbursed</li>
              <li>• <strong>Claim_Count:</strong> Total number of claims</li>
              <li>• <strong>Unique_Beneficiaries:</strong> Number of unique patients</li>
              <li>• <strong>Pct_Male:</strong> Percentage of male patients (0-1)</li>
              <li>• <strong>Mean_Reimbursed:</strong> <em>Calculated automatically</em></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800 mb-2">Model Info:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Model Type:</strong> XGBoost Classifier</li>
              <li>• <strong>Features:</strong> 5 numerical features</li>
              <li>• <strong>Output:</strong> Fraud probability (0-1)</li>
              <li>• <strong>Threshold:</strong> 0.5 for fraud detection</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-600 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('result')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'result'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Prediction Result</span>
        </button>
        <button
          onClick={() => setActiveTab('interpret')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'interpret'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Interpretability</span>
        </button>
        <button
          onClick={() => prediction && setActiveTab('chatbot')}
          className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chatbot'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-400'
          } ${!prediction ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!prediction}
        >
          <MessageCircle className="w-4 h-4" />
          <span>AI Assistant</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'result' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Prediction Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Provider Information</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Name *
                </label>
                <input
                  type="text"
                  value={formData.Provider}
                  onChange={(e) => handleInputChange('Provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter provider name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount Reimbursed ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.Total_Reimbursed}
                  onChange={(e) => handleInputChange('Total_Reimbursed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claim Count *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.Claim_Count}
                  onChange={(e) => handleInputChange('Claim_Count', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unique Beneficiaries *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.Unique_Beneficiaries}
                  onChange={(e) => handleInputChange('Unique_Beneficiaries', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage Male (0-1) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.Pct_Male}
                  onChange={(e) => handleInputChange('Pct_Male', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.5"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter a value between 0 and 1 (e.g., 0.5 for 50%)</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Run Prediction</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results Panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Prediction Results</h3>
            
            {!prediction ? (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Enter provider data and run prediction to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Calculated Mean Reimbursed */}
                {calculatedMeanReimbursed !== null && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Calculated Values</h4>
                    <p className="text-blue-700">
                      <strong>Mean Reimbursed:</strong> ${calculatedMeanReimbursed.toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Calculated as Total Reimbursed ÷ Claim Count
                    </p>
                  </div>
                )}

                {/* Prediction Result */}
                <div className={`border rounded-lg p-4 ${
                  prediction.Prediccion === 1 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Fraud Detection Result</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prediction.Prediccion === 1
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {prediction.Prediccion === 1 ? 'FRAUD DETECTED' : 'NO FRAUD'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Provider:</strong> {prediction.Provider}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Fraud Probability:</strong> {(prediction.Probabilidad_Fraude * 100).toFixed(2)}%
                    </p>
                  </div>

                  {/* Probability Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          prediction.Probabilidad_Fraude > 0.5 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${prediction.Probabilidad_Fraude * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                  <p className="text-sm text-gray-600">
                    {prediction.Probabilidad_Fraude > 0.7 ? (
                      <span className="text-red-600 font-medium">High Risk - Immediate investigation recommended</span>
                    ) : prediction.Probabilidad_Fraude > 0.5 ? (
                      <span className="text-orange-600 font-medium">Medium Risk - Further monitoring advised</span>
                    ) : (
                      <span className="text-green-600 font-medium">Low Risk - No immediate action required</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'interpret' && (
        <div className="space-y-8">
          {/* LIME Explanation */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900">LIME Explanation</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Local Interpretable Model-agnostic Explanations show how each feature contributed to this specific prediction.
            </p>
            {explanationLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Loading LIME explanation...</span>
              </div>
            ) : limeExplanation ? (
              <div className="space-y-3">
                {limeExplanation.feature_contributions.map((item: any, idx: number) => (
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
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No LIME explanation available</p>
              </div>
            )}
          </div>

          {/* SHAP Explanation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">SHAP Explanation</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              SHapley Additive exPlanations show the exact contribution of each feature to the prediction.
            </p>
            {explanationLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading SHAP explanation...</span>
              </div>
            ) : shapExplanation ? (
              <div className="space-y-3">
                {shapExplanation.feature_contributions.map((item: any, idx: number) => (
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
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No SHAP explanation available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chatbot' && (
        prediction ? (
          <AiAssistantChat
            styleVariant="card"
            context={{ prediction, formData }}
            suggestedQuestions={[
              prediction.Prediccion === 1
                ? '¿Por qué el modelo marcó este caso como posible fraude?'
                : '¿Por qué el modelo considera que este caso no es fraudulento?',
              prediction.Prediccion === 1
                ? '¿Qué métricas contribuyeron más a la predicción?'
                : '¿Qué métricas contribuyeron a la clasificación como no fraude?',
              '¿Cómo puedo reducir el riesgo de fraude?',
              '¿Qué significa la explicación LIME/SHAP?'
            ]}
            title="AI Fraud Analysis Assistant"
            description="This assistant analyzes the individual prediction and provides intelligent insights about the case."
          />
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center text-purple-700">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p className="font-medium">Run a prediction first to enable the AI Assistant.</p>
            <p className="text-sm text-purple-500 mt-1">The assistant will be available once you have prediction results to analyze.</p>
          </div>
        )
      )}
    </div>
  );
} 