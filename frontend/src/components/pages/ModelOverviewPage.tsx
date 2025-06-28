import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer, Cell } from 'recharts';
import { Activity, TrendingUp, Target, Shield, Brain, Calendar, Database, Layers, AlertCircle, Settings } from 'lucide-react';
import { apiService, MetricsResponse } from '../../services/api';

interface ModelMetrics {
  model_info: {
    name: string;
    type: string;
    version: string;
    training_date: string;
    samples_trained: number;
    features: number;
  };
  performance_metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    specificity: number;
    negative_predictive_value: number;
  };
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  feature_importance: Array<{
    feature: string;
    importance: number;
  }>;
  best_params: {
    learning_rate: number;
    max_depth: number;
    n_estimators: number;
    scale_pos_weight: number;
  };
  roc_curve_data: Array<{
    fpr: number;
    tpr: number;
  }>;
  shap_feature_importance?: Array<{
    feature: string;
    importance: number;
  }>;
}

export function ModelOverviewPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [apiMetrics, setApiMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shapData, setShapData] = useState<any>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Cargar métricas desde el archivo JSON en public/data
        const response = await fetch('/data/xgb_fraud_metrics.json');
        if (!response.ok) throw new Error('No se pudo cargar xgb_fraud_metrics.json');
        const data = await response.json();

        // Mapear al formato ModelMetrics
        const convertedMetrics: ModelMetrics = {
          model_info: {
            name: "XGBoost Fraud Detection Model",
            type: "XGBoost",
            version: "1.0.0",
            training_date: new Date().toISOString().split('T')[0],
            samples_trained: data.confusion_matrix[0][0] + data.confusion_matrix[0][1] + data.confusion_matrix[1][0] + data.confusion_matrix[1][1],
            features: data.feature_importance.length
          },
          performance_metrics: {
            precision: data.precision,
            recall: data.recall,
            f1_score: data.f1_score,
            roc_auc: data.roc_auc,
            specificity: 0, // Puedes calcularlo si lo necesitas
            negative_predictive_value: 0 // Puedes calcularlo si lo necesitas
          },
          confusion_matrix: {
            true_positive: data.confusion_matrix[1][1],
            false_positive: data.confusion_matrix[0][1],
            true_negative: data.confusion_matrix[0][0],
            false_negative: data.confusion_matrix[1][0]
          },
          feature_importance: data.feature_importance.map((f: any) => ({ feature: f.feature, importance: f.importance })),
          best_params: data.best_params,
          roc_curve_data: [], // Si tienes datos de curva ROC, agrégalos aquí
          shap_feature_importance: data.shap_feature_importance ? data.shap_feature_importance.map((f: any) => ({ feature: f.feature, importance: f.importance })) : undefined
        };
        setMetrics(convertedMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading metrics');
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading model metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <span className="text-lg font-medium">Error loading model metrics</span>
          </div>
          <p className="text-gray-600">{error || 'Unable to load metrics'}</p>
        </div>
      </div>
    );
  }

  const performanceData = [
    { name: 'Precision', value: metrics.performance_metrics.precision * 100 },
    { name: 'Recall', value: metrics.performance_metrics.recall * 100 },
    { name: 'F1-Score', value: metrics.performance_metrics.f1_score * 100 },
    { name: 'ROC-AUC', value: metrics.performance_metrics.roc_auc * 100 },
    { name: 'Specificity', value: metrics.performance_metrics.specificity * 100 }
  ];

  const confusionMatrixData = [
    { name: 'True Positive', value: metrics.confusion_matrix.true_positive, color: '#10B981' },
    { name: 'False Positive', value: metrics.confusion_matrix.false_positive, color: '#F59E0B' },
    { name: 'True Negative', value: metrics.confusion_matrix.true_negative, color: '#3B82F6' },
    { name: 'False Negative', value: metrics.confusion_matrix.false_negative, color: '#EF4444' }
  ];

  // Datos para la matriz de confusión visual
  const confusionMatrixVisual = [
    [
      { value: metrics.confusion_matrix.true_negative, label: 'TN', color: '#3B82F6', bgColor: '#3B82F6', textColor: '#fff' },
      { value: metrics.confusion_matrix.false_positive, label: 'FP', color: '#3B82F6', bgColor: '#fff', textColor: '#3B82F6', border: true }
    ],
    [
      { value: metrics.confusion_matrix.false_negative, label: 'FN', color: '#3B82F6', bgColor: '#fff', textColor: '#3B82F6', border: true },
      { value: metrics.confusion_matrix.true_positive, label: 'TP', color: '#87CEEB', bgColor: '#87CEEB', textColor: '#fff' }
    ]
  ];

  // SHAP y Model Feature Importance
  const shapFeatureImportance = (metrics.shap_feature_importance && metrics.shap_feature_importance.length > 0)
    ? metrics.shap_feature_importance
    : metrics.feature_importance || [];
  const modelFeatureImportance = metrics.feature_importance || [];
  const bestParams = metrics.best_params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Model Overview & Performance</h1>
            <p className="text-gray-600">Comprehensive analysis of fraud detection model metrics</p>
          </div>
        </div>
      </div>

      {/* Model Information from API */}
      {apiMetrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Model Information from API</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Model Details:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Type: {apiMetrics.model_info.model_type}</li>
                <li>• Features: {apiMetrics.model_info.n_features}</li>
                <li>• Model Path: {apiMetrics.model_info.model_path}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Performance Metrics:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ROC-AUC: {(apiMetrics.metrics.roc_auc * 100).toFixed(2)}%</li>
                <li>• Precision: {(apiMetrics.metrics.precision * 100).toFixed(2)}%</li>
                <li>• Recall: {(apiMetrics.metrics.recall * 100).toFixed(2)}%</li>
                <li>• F1-Score: {(apiMetrics.metrics.f1_score * 100).toFixed(2)}%</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Ocho rectángulos con métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Precision</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{(metrics.performance_metrics.precision * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Recall</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{(metrics.performance_metrics.recall * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-blue-900">F1-Score</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{(metrics.performance_metrics.f1_score * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <h3 className="font-semibold text-amber-900">ROC-AUC</h3>
          </div>
          <p className="text-3xl font-bold text-amber-700">{(metrics.performance_metrics.roc_auc * 100).toFixed(1)}%</p>
        </div>
        {/* Puedes agregar más métricas aquí si lo deseas */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-2">
            <Layers className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Features</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{apiMetrics?.model_info?.n_features || 5}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-2">
            <Database className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Samples</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{metrics.model_info.samples_trained}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Training Date</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{metrics.model_info.training_date.split('T')[0]}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-6 h-6 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Model Type</h3>
          </div>
          <p className="text-3xl font-bold text-amber-700">{metrics.model_info.type}</p>
        </div>
      </div>

      {/* SHAP y Model Feature Importance lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* SHAP Feature Importance */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-blue-900 mb-4">SHAP Feature Importance</h3>
          <div className="space-y-4">
            {shapFeatureImportance.length > 0 ? (
              shapFeatureImportance.map((feature: any, idx: number) => (
                <div key={feature.feature} className="flex items-center">
                  <span className="w-40 text-gray-700 font-medium">{feature.feature}</span>
                  <div className="flex-1 mx-4 h-4 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${(feature.importance * 100).toFixed(1)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-blue-600 font-semibold" style={{ minWidth: 48, textAlign: 'right' }}>
                    {(feature.importance * 100).toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading SHAP feature importance...</p>
              </div>
            )}
          </div>
        </div>
        {/* Model Feature Importance */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-green-900 mb-4">Model Feature Importance</h3>
          <div className="space-y-4">
            {modelFeatureImportance.map((feature: any, idx: number) => (
              <div key={feature.feature} className="flex items-center">
                <span className="w-40 text-gray-700 font-medium">{feature.feature}</span>
                <div className="flex-1 mx-4 h-4 bg-green-100 rounded-full overflow-hidden">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-green-400 to-yellow-400"
                    style={{ width: `${(feature.importance * 100).toFixed(1)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-green-700 font-semibold" style={{ minWidth: 48, textAlign: 'right' }}>
                  {(feature.importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matriz de confusión y Best Hyperparameters lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Matriz de confusión visual */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex-1 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-600" />
            Confusion Matrix
          </h3>
          <div className="grid grid-cols-2 grid-rows-2 gap-2 mb-4">
            {confusionMatrixVisual.flat().map((cell, idx) => (
              <div
                key={cell.label}
                className="w-24 h-24 flex flex-col items-center justify-center rounded-lg shadow text-lg font-bold"
                style={{ 
                  backgroundColor: cell.bgColor, 
                  color: cell.textColor,
                  border: cell.border ? `2px solid ${cell.color}` : 'none'
                }}
              >
                {cell.value}
                <span className="text-xs font-normal mt-1">{cell.label}</span>
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            <span className="font-semibold">TN</span>: True Negative, <span className="font-semibold">FP</span>: False Positive<br />
            <span className="font-semibold">FN</span>: False Negative, <span className="font-semibold">TP</span>: True Positive
          </div>
        </div>
        {/* Best Hyperparameters */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex-1 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-purple-600" />
            Best Hyperparameters
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            {Object.entries(bestParams).map(([key, value]) => (
              <li key={key} className="flex justify-between items-center bg-purple-50 rounded-md px-3 py-2 mb-1">
                <span className="font-medium capitalize text-purple-900">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono text-base text-purple-700">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
