import { useState } from 'react';
import { User, Calculator, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { apiService } from '../../services/api';

interface PredictionForm {
  Provider: string;
  Total_Reimbursed: number;
  Mean_Reimbursed: number;
  Claim_Count: number;
  Unique_Beneficiaries: number;
  Pct_Male: number;
}

interface PredictionResult {
  Provider: string;
  Prediccion: number;
  Probabilidad_Fraude: number;
}

export function SinglePredictionPage() {
  const [formData, setFormData] = useState<PredictionForm>({
    Provider: '',
    Total_Reimbursed: 0,
    Mean_Reimbursed: 0,
    Claim_Count: 0,
    Unique_Beneficiaries: 0,
    Pct_Male: 0
  });
  
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    try {
      // Validar datos
      if (!formData.Provider.trim()) {
        throw new Error('Provider name is required');
      }

      if (formData.Pct_Male < 0 || formData.Pct_Male > 1) {
        throw new Error('Pct_Male must be between 0 and 1');
      }

      // Crear archivo CSV temporal con los datos
      const csvContent = [
        'Provider,Total_Reimbursed,Mean_Reimbursed,Claim_Count,Unique_Beneficiaries,Pct_Male',
        `${formData.Provider},${formData.Total_Reimbursed},${formData.Mean_Reimbursed},${formData.Claim_Count},${formData.Unique_Beneficiaries},${formData.Pct_Male}`
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'single_prediction.csv', { type: 'text/csv' });

      // Subir archivo
      const uploadResponse = await apiService.uploadFile(file);
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message);
      }

      // Procesar datos
      const ingestResponse = await apiService.ingestData();
      if (!ingestResponse.success) {
        throw new Error(ingestResponse.message);
      }

      // Obtener predicción
      const predictResponse = await apiService.predictFraud();
      if (!predictResponse.success || predictResponse.predictions.length === 0) {
        throw new Error('Prediction failed');
      }

      const result = predictResponse.predictions[0];
      setPrediction(result);
      setSuccessMessage('Prediction completed successfully!');

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
      Mean_Reimbursed: 0,
      Claim_Count: 0,
      Unique_Beneficiaries: 0,
      Pct_Male: 0
    });
    setPrediction(null);
    setError(null);
    setSuccessMessage(null);
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
              <li>• <strong>Provider:</strong> Provider name (not used in prediction)</li>
              <li>• <strong>Total_Reimbursed:</strong> Total amount reimbursed</li>
              <li>• <strong>Mean_Reimbursed:</strong> Average reimbursement per claim</li>
              <li>• <strong>Claim_Count:</strong> Total number of claims</li>
              <li>• <strong>Unique_Beneficiaries:</strong> Number of unique patients</li>
              <li>• <strong>Pct_Male:</strong> Percentage of male patients (0-1)</li>
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
                Total Reimbursed ($)
              </label>
              <input
                type="number"
                value={formData.Total_Reimbursed}
                onChange={(e) => handleInputChange('Total_Reimbursed', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mean Reimbursed ($)
              </label>
              <input
                type="number"
                value={formData.Mean_Reimbursed}
                onChange={(e) => handleInputChange('Mean_Reimbursed', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claim Count
              </label>
              <input
                type="number"
                value={formData.Claim_Count}
                onChange={(e) => handleInputChange('Claim_Count', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unique Beneficiaries
              </label>
              <input
                type="number"
                value={formData.Unique_Beneficiaries}
                onChange={(e) => handleInputChange('Unique_Beneficiaries', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage Male (0-1)
              </label>
              <input
                type="number"
                value={formData.Pct_Male}
                onChange={(e) => handleInputChange('Pct_Male', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.5"
                min="0"
                max="1"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Enter value between 0 and 1 (e.g., 0.5 for 50%)</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span>Predict Fraud</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Results */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Prediction Results</h3>
          
          {prediction ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Provider: {prediction.Provider}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fraud Detection:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prediction.Prediccion === 1 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {prediction.Prediccion === 1 ? 'FRAUD DETECTED' : 'NO FRAUD'}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Fraud Probability:</span>
                      <span className="font-medium text-gray-900">
                        {(prediction.Probabilidad_Fraude * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          prediction.Probabilidad_Fraude > 0.7 ? 'bg-red-500' : 
                          prediction.Probabilidad_Fraude > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${prediction.Probabilidad_Fraude * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Risk Assessment</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {prediction.Probabilidad_Fraude > 0.7 && (
                    <p>⚠️ <strong>High Risk:</strong> Strong indicators of potential fraud detected.</p>
                  )}
                  {prediction.Probabilidad_Fraude > 0.4 && prediction.Probabilidad_Fraude <= 0.7 && (
                    <p>⚠️ <strong>Medium Risk:</strong> Some suspicious patterns detected.</p>
                  )}
                  {prediction.Probabilidad_Fraude <= 0.4 && (
                    <p>✅ <strong>Low Risk:</strong> No significant fraud indicators detected.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Enter provider data and click "Predict Fraud" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 