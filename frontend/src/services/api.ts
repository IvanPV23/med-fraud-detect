const API_BASE_URL = 'http://localhost:8000';

export interface UploadResponse {
  success: boolean;
  message: string;
  filename: string;
  file_path: string;
  file_size: number;
}

export interface IngestResponse {
  success: boolean;
  message: string;
  input_rows: number;
  output_rows: number;
  output_path: string;
}

export interface PredictionResult {
  Provider: string;
  Prediccion: number;
  Probabilidad_Fraude: number;
}

export interface SHAPExplanation {
  feature_names: string[];
  feature_values: number[];
  shap_values: number[];
  base_value: number;
  prediction: number;
  prediction_proba: number;
  feature_contributions: Array<{
    feature: string;
    value: number;
    shap_value: number;
    impact: 'positive' | 'negative';
  }>;
}

export interface LIMEExplanation {
  feature_names: string[];
  feature_values: number[];
  prediction: number;
  prediction_proba: number;
  explanation_type: string;
  feature_contributions: Array<{
    feature: string;
    value: number;
    weight: number;
    impact: 'positive' | 'negative';
    feature_name_raw: string;
  }>;
  lime_info: {
    num_features_used: number;
    explanation_score: number;
    local_prediction: number | null;
  };
}

export interface FeatureImportance {
  feature_importance: Array<{
    feature: string;
    importance: number;
    rank: number;
  }>;
  total_features: number;
}

export interface PredictResponse {
  success: boolean;
  predictions: PredictionResult[];
  total_providers: number;
}

export interface SinglePredictionRequest {
  Provider: string;
  Total_Reimbursed: number;
  Claim_Count: number;
  Unique_Beneficiaries: number;
  Pct_Male: number;
}

export interface SinglePredictionResponse {
  success: boolean;
  prediction: PredictionResult;
  calculated_mean_reimbursed: number;
}

export interface MetricsResponse {
  success: boolean;
  metrics: {
    roc_auc: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: number[][];
    best_params: {
      learning_rate: number;
      max_depth: number;
      n_estimators: number;
      scale_pos_weight: number;
    };
  };
  model_info: {
    model_type: string;
    feature_names: string[];
    n_features: number;
    model_path: string;
  };
}

export interface DashboardDataResponse {
  success: boolean;
  data: Array<{
    Provider: string;
    Total_Reimbursed: number;
    Mean_Reimbursed: number;
    Claim_Count: number;
    Unique_Beneficiaries: number;
    Avg_Beneficiary_Age: number;
    Pct_Male: number;
    [key: string]: any;
  }>;
}

export interface ProviderDetailsResponse {
  success: boolean;
  provider: any;
}

export interface GenerateDashboardResponse {
  success: boolean;
  message: string;
  output_path: string;
  total_providers: number;
  columns: string[];
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed! status: ${response.status}`);
    }

    return await response.json();
  }

  async ingestData(): Promise<IngestResponse> {
    return this.makeRequest<IngestResponse>('/ingest', {
      method: 'POST',
    });
  }

  async predictFraud(): Promise<PredictResponse> {
    return this.makeRequest<PredictResponse>('/predict', {
      method: 'POST',
    });
  }

  async predictSingle(data: SinglePredictionRequest): Promise<SinglePredictionResponse> {
    return this.makeRequest<SinglePredictionResponse>('/predict-single', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMetrics(): Promise<MetricsResponse> {
    return this.makeRequest<MetricsResponse>('/metricas');
  }

  async healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
    return this.makeRequest<{ status: string; model_loaded: boolean }>('/health');
  }

  async generateDashboard(): Promise<GenerateDashboardResponse> {
    return this.makeRequest<GenerateDashboardResponse>('/generate-dashboard', {
      method: 'POST',
    });
  }

  async getDashboardData(): Promise<DashboardDataResponse> {
    return this.makeRequest<DashboardDataResponse>('/api/dashboard-data');
  }

  async getProviderDetails(providerName: string): Promise<ProviderDetailsResponse> {
    return this.makeRequest<ProviderDetailsResponse>(`/provider-details/${encodeURIComponent(providerName)}`);
  }

  // SHAP y LIME Explainability
  async explainSHAP(request: SinglePredictionRequest): Promise<{ success: boolean; explanation: SHAPExplanation; provider: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/explain-shap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error explaining SHAP:', error);
      throw error;
    }
  }

  async explainLIME(request: SinglePredictionRequest): Promise<{ success: boolean; explanation: LIMEExplanation; provider: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/explain-lime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error explaining LIME:', error);
      throw error;
    }
  }

  async getFeatureImportance(): Promise<{ success: boolean; feature_importance: FeatureImportance }> {
    try {
      const response = await fetch(`${this.baseUrl}/feature-importance`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting feature importance:', error);
      throw error;
    }
  }

  async getModelFeatureImportance(): Promise<{ 
    success: boolean; 
    feature_importance: Array<{
      feature: string;
      importance: number;
      rank: number;
    }>;
    total_features: number;
    model_type: string;
    feature_names: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/model-feature-importance`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting model feature importance:', error);
      throw error;
    }
  }

  async explainBulkSHAP(): Promise<{ success: boolean; explanations: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/explain-bulk-shap`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error explaining bulk SHAP:', error);
      throw error;
    }
  }

  async compareExplanations(providerName: string): Promise<{ success: boolean; comparison: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/compare-explanations/${encodeURIComponent(providerName)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error comparing explanations:', error);
      throw error;
    }
  }

  async getSHAPModelOverview(): Promise<{ 
    success: boolean; 
    shap_explanations: any;
    explanation_type: string;
    data_source: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/shap-model-overview`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting SHAP model overview:', error);
      throw error;
    }
  }

  async chatbotAnalyze(context: any, message: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
    fallback_response?: string;
    rate_limit_info?: {
      requests_remaining: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/chatbot/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          message
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in chatbot analysis:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService(); 