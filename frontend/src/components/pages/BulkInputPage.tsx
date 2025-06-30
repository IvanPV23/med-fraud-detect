import { useState, useRef } from 'react';
import { Upload, FileText, Play, Download, AlertCircle, CheckCircle, X, Eye, Users, Building2, Activity, Database, Search, BarChart3 } from 'lucide-react';
import { apiService, PredictionResult as ApiPredictionResult } from '../../services/api';
import { ProviderDetailsModal } from '../ProviderDetailsModal';
import { InteractiveDashboard } from '../InteractiveDashboard';
import { AiAssistantChat } from '../ui/AiAssistantChat';

interface FileUpload {
  file: File;
  type: 'beneficiary' | 'inpatient' | 'outpatient' | 'provider';
  status: 'uploaded' | 'processing' | 'error';
  error?: string;
}

interface CSVRow {
  Provider: string;
  TotalClaims: number;
  NumInpatientClaims: number;
  NumOutpatientClaims: number;
  TotalAmountReimbursed: number;
  MeanAmountReimbursed: number;
  AvgClaimDurationDays: number;
  NumUniqueDiagnosisCodes: number;
  NumUniqueProcedureCodes: number;
  NumUniqueBeneficiaries: number;
  IsolationForestScore?: number;
}

interface PredictionResult {
  Provider: string;
  Prediccion: number;
  Probabilidad_Fraude: number;
}

export function BulkInputPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [testFinalReady, setTestFinalReady] = useState(false);
  const [dataProcessed, setDataProcessed] = useState(false);
  
  // Nuevos estados para modal y dashboard
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInteractiveDashboard, setShowInteractiveDashboard] = useState(false);

  const fileTypes = [
    { type: 'beneficiary', label: 'Beneficiary Data', icon: Users, description: 'Patient beneficiary information' },
    { type: 'inpatient', label: 'Inpatient Data', icon: Building2, description: 'Inpatient claim data' },
    { type: 'outpatient', label: 'Outpatient Data', icon: Activity, description: 'Outpatient claim data' },
    { type: 'provider', label: 'Provider Data', icon: Database, description: 'Provider summary data' }
  ];

  const requiredColumns = [
    'Provider', 'TotalClaims', 'NumInpatientClaims', 'NumOutpatientClaims',
    'TotalAmountReimbursed', 'MeanAmountReimbursed', 'AvgClaimDurationDays',
    'NumUniqueDiagnosisCodes', 'NumUniqueProcedureCodes', 'NumUniqueBeneficiaries'
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleMultipleFileUpload(files);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleMultipleFileUpload = async (files: File[]) => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    
    const newUploads: FileUpload[] = [];
    
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        continue;
      }
      
      // Determinar tipo de archivo basado en el nombre
      const fileName = file.name.toLowerCase();
      let fileType: 'beneficiary' | 'inpatient' | 'outpatient' | 'provider' = 'provider';
      
      if (fileName.includes('beneficiary')) {
        fileType = 'beneficiary';
      } else if (fileName.includes('inpatient')) {
        fileType = 'inpatient';
      } else if (fileName.includes('outpatient')) {
        fileType = 'outpatient';
      } else {
        fileType = 'provider';
      }
      
      newUploads.push({
        file,
        type: fileType,
        status: 'uploaded'
      });
    }
    
    setUploadedFiles(prev => [...prev, ...newUploads]);
    
    // Subir archivos al backend
    try {
      for (const upload of newUploads) {
        const uploadResponse = await apiService.uploadFile(upload.file);
        if (!uploadResponse.success) {
          upload.status = 'error';
          upload.error = uploadResponse.message;
        }
      }
      
      setSuccessMessage(`Successfully uploaded ${newUploads.length} files!`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    await handleMultipleFileUpload([file]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngest = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const ingestResponse = await apiService.ingestData();
      if (!ingestResponse.success) {
        throw new Error(ingestResponse.message);
      }
      setDataProcessed(true);
      setTestFinalReady(true);
      setSuccessMessage('Data processed successfully! You can now preview and run predictions.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during data processing');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const predictResponse = await apiService.predictFraud();
      if (!predictResponse.success) {
        throw new Error('Prediction failed');
      }
      setPredictions(predictResponse.predictions);
      setSuccessMessage(`Predictions completed! Analyzed ${predictResponse.total_providers} providers.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during prediction');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestFinalPreview = async () => {
    try {
      console.log('Fetching test_final preview...');
      const response = await fetch('/api/test-final-preview');
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      console.log('Preview data received:', data);
      setCsvData(data);
    } catch (err) {
      setError('Error loading preview from test_final.csv');
      console.error('Error loading preview from test_final.csv', err);
    }
  };

  const handleTogglePreview = async () => {
    console.log('Toggle Preview clicked. showPreview:', showPreview, 'dataProcessed:', dataProcessed);
    if (!showPreview && dataProcessed) {
      await fetchTestFinalPreview();
    }
    setShowPreview((prev) => !prev);
  };

  const downloadResults = () => {
    const csvContent = [
      'Provider,Fraud_Prediction,Fraud_Probability',
      ...predictions.map(p => `${p.Provider},${p.Prediccion === 1 ? 'Fraud' : 'No_Fraud'},${(p.Probabilidad_Fraude * 100).toFixed(2)}%`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud_predictions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleProviderDetails = (providerName: string) => {
    setSelectedProvider(providerName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProvider(null);
  };

  const getSelectedProviderPrediction = () => {
    if (!selectedProvider) return null;
    return predictions.find(p => p.Provider === selectedProvider) || null;
  };

  // Filtrar predicciones por Provider
  const filteredPredictions = predictions.filter(p =>
    p.Provider.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredPredictions.length / pageSize);
  const paginatedResults = filteredPredictions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Input (CSV Upload)</h1>
            <p className="text-gray-600">Upload provider data for batch fraud detection analysis</p>
          </div>
        </div>
      </div>

      {/* Schema Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Supported File Types</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">File Types:</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              {fileTypes.map((fileType) => {
                const Icon = fileType.icon;
                return (
                  <li key={fileType.type} className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span><strong>{fileType.label}:</strong> {fileType.description}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Processing:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Upload multiple CSV files simultaneously</li>
              <li>• System automatically detects file types</li>
              <li>• Data is processed and consolidated</li>
              <li>• First 10 records are shown in preview</li>
              <li>• Fraud detection runs on processed data</li>
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
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Upload Area */}
      {!uploadedFiles.length && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV Files</h3>
              <p className="text-gray-600 mb-4">Drag and drop your CSV files here, or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Supported files: Beneficiary, Inpatient, Outpatient, and Provider data</p>
              <button
                onClick={handleFileSelect}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Uploading...' : 'Choose Files'}
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleMultipleFileUpload(Array.from(e.target.files))}
          />
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h3>
          <div className="space-y-3">
            {uploadedFiles.map((upload, index) => {
              const fileType = fileTypes.find(ft => ft.type === upload.type);
              const Icon = fileType?.icon || FileText;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{upload.file.name}</p>
                      <p className="text-sm text-gray-600">{fileType?.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {upload.status === 'uploaded' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* File Preview */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Data Preview (First 10 Records)</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTogglePreview}
                disabled={!dataProcessed}
                className={`flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium ${!dataProcessed ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Eye className="w-4 h-4" />
                <span>Toggle Preview</span>
              </button>
            </div>
          </div>
          {showPreview && csvData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {Object.keys(csvData[0] || {}).slice(0, 6).map((header) => (
                      <th key={header} className="text-left py-2 px-3 font-medium text-gray-700">
                        {header}
                      </th>
                    ))}
                    <th className="text-left py-2 px-3 font-medium text-gray-700">...</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {Object.values(row).slice(0, 6).map((value, i) => (
                        <td key={i} className="py-2 px-3 text-gray-600">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-gray-400">...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 10 rows of {csvData.length} total rows
                </p>
              )}
            </div>
          )}
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleIngest}
              disabled={loading || dataProcessed}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {loading && !dataProcessed ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Process Data</span>
                </>
              )}
            </button>
            <button
              onClick={handlePredict}
              disabled={loading || !dataProcessed}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {loading && dataProcessed ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Predicting...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Predict</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {predictions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Prediction Results</h3>
                <p className="text-gray-600">{filteredPredictions.length} providers analyzed</p>
              </div>
            </div>
            {/* Barra de búsqueda */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Buscar por Provider..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInteractiveDashboard(!showInteractiveDashboard)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Interactive Dashboard</span>
              </button>
              <button
                onClick={downloadResults}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Results</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Fraud Prediction</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Fraud Probability</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((prediction, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{prediction.Provider}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.Prediccion === 1 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {prediction.Prediccion === 1 ? 'Fraud Detected' : 'No Fraud'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              prediction.Probabilidad_Fraude > 0.6 ? 'bg-red-500' : 
                              prediction.Probabilidad_Fraude > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${prediction.Probabilidad_Fraude * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {(prediction.Probabilidad_Fraude * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleProviderDetails(prediction.Provider)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="View Provider Details"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          <div className="flex justify-center items-center space-x-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
            >Anterior</button>
            <span className="text-sm">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
            >Siguiente</button>
          </div>
        </div>
      )}

      {/* Interactive Dashboard */}
      {showInteractiveDashboard && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <InteractiveDashboard 
            predictions={predictions} 
            isVisible={showInteractiveDashboard} 
          />
        </div>
      )}

      {/* Provider Details Modal */}
      {isModalOpen && selectedProvider && (
        <ProviderDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          providerName={selectedProvider}
          prediction={getSelectedProviderPrediction()}
        />
      )}
    </div>
  );
}
