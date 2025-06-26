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

export interface PredictResponse {
  success: boolean;
  predictions: PredictionResult[];
  total_providers: number;
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

  async getMetrics(): Promise<MetricsResponse> {
    return this.makeRequest<MetricsResponse>('/metricas');
  }

  async healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
    return this.makeRequest<{ status: string; model_loaded: boolean }>('/health');
  }
}

export const apiService = new ApiService(); 