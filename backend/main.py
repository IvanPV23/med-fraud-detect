from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
import json
from typing import List, Dict, Any
import logging
import pandas as pd
from pydantic import BaseModel
import numpy as np
import joblib
import lime
import lime.lime_tabular

# Importar agentes
from agents.ingestor import DataIngestor, process_test_files
from agents.predictor import FraudPredictor
from agents.dashboard_ingestor import process_dashboard_files
from agents.shap_explainer import SHAPExplainer
from agents.lime_explainer import LIMEExplainer

# Para Gemini AI (opcional)
import requests
from datetime import datetime, timedelta

# Importar AI Assistant
from utils.ai_assistant import ai_assistant_chat

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modelo para predicción individual
class SinglePredictionRequest(BaseModel):
    Provider: str
    Total_Reimbursed: float
    Claim_Count: int
    Unique_Beneficiaries: int
    Pct_Male: float

# Crear aplicación FastAPI
app = FastAPI(
    title="Sistema de Detección de Fraude Médico",
    description="API para procesamiento y predicción de fraude en reclamaciones médicas",
    version="1.0.0"
)

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar agentes
ingestor = DataIngestor()
predictor = FraudPredictor()
shap_explainer = SHAPExplainer()
lime_explainer = LIMEExplainer()

# Para Gemini AI (opcional)
import requests
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_requests_per_hour=10):
        self.max_requests = max_requests_per_hour
        self.requests = []
    
    def can_make_request(self):
        now = datetime.now()
        # Limpiar requests antiguos (más de 1 hora)
        self.requests = [req_time for req_time in self.requests 
                        if now - req_time < timedelta(hours=1)]
        
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False

# Rate limiter global
gemini_rate_limiter = RateLimiter(max_requests_per_hour=5)  # Muy conservador

@app.get("/")
async def root():
    """Endpoint raíz para verificar que el servidor está funcionando"""
    return {
        "message": "Sistema de Detección de Fraude Médico API",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Endpoint para subir archivos CSV de test a data/test_uploaded/
    """
    try:
        if not file.filename or not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos CSV")
        upload_dir = "data/test_uploaded"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {
            "success": True,
            "message": "Archivo subido exitosamente",
            "filename": file.filename,
            "file_path": file_path,
            "file_size": os.path.getsize(file_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo archivo: {str(e)}")

@app.post("/ingest")
async def ingest_data():
    """
    Procesa los 4 archivos de test en data/test_uploaded/ y genera tanto test_final.csv como test_dashboard.csv.
    """
    try:
        # Ejecutar ingestor normal para test_final.csv
        logger.info("Ejecutando ingestor normal...")
        process_test_files()
        
        # Ejecutar ingestor de dashboard para test_dashboard.csv
        logger.info("Ejecutando ingestor de dashboard...")
        success = process_dashboard_files()
        
        if not success:
            raise HTTPException(status_code=500, detail="Error generando datos de dashboard")
        
        return {
            "success": True, 
            "message": "Procesamiento completado: test_final.csv y test_dashboard.csv generados"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en procesamiento: {str(e)}")

@app.post("/generate-dashboard")
async def generate_dashboard():
    """
    Genera datos de dashboard agregados por proveedor.
    """
    try:
        success = process_dashboard_files()
        if success:
            return {"success": True, "message": "Dashboard generado exitosamente"}
        else:
            raise HTTPException(status_code=500, detail="Error generando dashboard")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando dashboard: {str(e)}")

@app.get("/api/dashboard-data")
async def get_dashboard_data():
    """Obtiene datos agregados para el dashboard"""
    try:
        # Generar datos de dashboard si no existen
        dashboard_file = os.path.join("data", "test_dashboard", "test_dashboard.csv")
        if not os.path.exists(dashboard_file):
            logger.info("Generando datos de dashboard...")
            success = process_dashboard_files()
            if not success:
                return {"success": False, "error": "Error generando dashboard"}
        
        # Cargar datos de dashboard
        dashboard_df = pd.read_csv(dashboard_file)
        logger.info(f"Datos de dashboard cargados: {len(dashboard_df)} providers")
        
        # Convertir a lista de diccionarios para el frontend
        dashboard_data = dashboard_df.to_dict('records')
        
        return {
            "success": True,
            "data": dashboard_data
        }
        
    except Exception as e:
        logger.error(f"Error cargando datos de dashboard: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/provider-details/{provider_name}")
async def get_provider_details(provider_name: str):
    """
    Obtiene detalles específicos de un proveedor para el modal.
    """
    try:
        dashboard_file = os.path.join("data", "test_dashboard", "test_dashboard.csv")
        if not os.path.exists(dashboard_file):
            raise HTTPException(
                status_code=404,
                detail="No se encontró el archivo de dashboard. Ejecute /ingest primero."
            )
        
        df = pd.read_csv(dashboard_file)
        provider_data = df[df['Provider'] == provider_name]
        
        if provider_data.empty:
            raise HTTPException(status_code=404, detail=f"Proveedor '{provider_name}' no encontrado")
        
        return {
            "success": True,
            "provider": provider_data.iloc[0].to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo detalles del proveedor: {str(e)}")

@app.post("/predict")
async def predict_fraud():
    try:
        processed_file = "data/test_final/test_final.csv"
        if not os.path.exists(processed_file):
            raise HTTPException(
                status_code=404,
                detail="No se encontró el archivo procesado. Ejecute /ingest primero."
            )
        predictions = predictor.predict_from_csv(processed_file)
        return {
            "success": True,
            "predictions": predictions,
            "total_providers": len(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

@app.get("/metricas")
async def get_metrics():
    try:
        metrics_file = "metrics/xgb_fraud_metrics.json"
        if not os.path.exists(metrics_file):
            raise HTTPException(status_code=404, detail="Archivo de métricas no encontrado")
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)
        model_info = predictor.get_model_info()
        return {
            "success": True,
            "metrics": metrics,
            "model_info": model_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo métricas: {str(e)}")

@app.get("/model-feature-importance")
async def get_model_feature_importance():
    """
    Obtiene las importancias de features directamente del modelo XGBoost.
    """
    try:
        # Obtener información del modelo
        model_info = predictor.get_model_info()
        if "error" in model_info:
            raise HTTPException(status_code=500, detail="Modelo no cargado")
        model = predictor.model
        if model is None:
            raise HTTPException(status_code=500, detail="Modelo no disponible")
        # Obtener importancias de features
        feature_importances = model.feature_importances_
        feature_names = predictor.feature_names
        # Crear lista de importancias con ranking
        importance_list = []
        for i, (feature, importance) in enumerate(zip(feature_names, feature_importances)):
            importance_list.append({
                "feature": feature,
                "importance": float(importance),
                "rank": 0  # Se calculará después
            })
        # Ordenar por importancia y asignar ranking
        importance_list.sort(key=lambda x: x['importance'], reverse=True)
        for i, item in enumerate(importance_list):
            item['rank'] = i + 1
        return {
            "success": True,
            "feature_importance": importance_list,
            "total_features": len(feature_names),
            "model_type": model_info.get("model_type", "Unknown"),
            "feature_names": feature_names
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo importancias del modelo: {str(e)}")

@app.get("/shap-model-overview")
async def get_shap_model_overview():
    """
    Obtiene explicaciones SHAP globales para el Model Overview.
    """
    try:
        # Usar datos de test_final.csv si existe para explicaciones más robustas
        csv_path = "data/test_final/test_final.csv"
        if not os.path.exists(csv_path):
            raise HTTPException(
                status_code=404,
                detail="No se encontró el archivo test_final.csv. Ejecute /ingest primero."
            )
        
        # Obtener explicaciones SHAP globales
        shap_explanations = shap_explainer.get_feature_importance_summary(csv_path)
        
        return {
            "success": True,
            "shap_explanations": shap_explanations,
            "explanation_type": "SHAP Global",
            "data_source": "test_final.csv"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo explicaciones SHAP: {str(e)}")

@app.get("/health")
async def health_check():
    try:
        model_info = predictor.get_model_info()
        return {
            "status": "healthy",
            "model_loaded": "error" not in model_info,
            "model_info": model_info
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.get('/api/test-final-preview')
def test_final_preview():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        test_final_path = os.path.join(base_dir, 'data', 'test_final', 'test_final.csv')
        df = pd.read_csv(test_final_path)
        preview = df.head(10).to_dict(orient='records')
        return JSONResponse(content=preview)
    except Exception as e:
        return JSONResponse(content={'error': str(e)}, status_code=500)

@app.post("/predict-single")
async def predict_single(request: SinglePredictionRequest):
    """
    Realiza una predicción individual con los datos proporcionados.
    Calcula automáticamente Mean_Reimbursed = Total_Reimbursed / Claim_Count
    """
    try:
        # Validar datos
        if request.Claim_Count <= 0:
            raise HTTPException(status_code=400, detail="Claim_Count debe ser mayor a 0")
        
        if request.Pct_Male < 0 or request.Pct_Male > 1:
            raise HTTPException(status_code=400, detail="Pct_Male debe estar entre 0 y 1")
        
        # Calcular Mean_Reimbursed automáticamente
        mean_reimbursed = request.Total_Reimbursed / request.Claim_Count
        
        # Crear DataFrame con los datos
        data = {
            'Provider': [request.Provider],
            'Total_Reimbursed': [request.Total_Reimbursed],
            'Mean_Reimbursed': [mean_reimbursed],
            'Claim_Count': [request.Claim_Count],
            'Unique_Beneficiaries': [request.Unique_Beneficiaries],
            'Pct_Male': [request.Pct_Male]
        }
        
        df = pd.DataFrame(data)
        
        # Realizar predicción
        predictions = predictor.predict_from_dataframe(df)
        
        if not predictions:
            raise HTTPException(status_code=500, detail="Error en la predicción")
        
        return {
            "success": True,
            "prediction": predictions[0],
            "calculated_mean_reimbursed": mean_reimbursed
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción individual: {str(e)}")

@app.post("/explain-shap")
async def explain_prediction_shap(request: SinglePredictionRequest):
    """
    Genera explicación SHAP para una predicción individual.
    """
    try:
        # Preparar features
        features = {
            'Total_Reimbursed': request.Total_Reimbursed,
            'Mean_Reimbursed': request.Total_Reimbursed / request.Claim_Count if request.Claim_Count > 0 else 0,
            'Claim_Count': request.Claim_Count,
            'Unique_Beneficiaries': request.Unique_Beneficiaries,
            'Pct_Male': request.Pct_Male
        }
        
        # Generar explicación SHAP
        explanation = shap_explainer.explain_prediction(features)
        
        return {
            "success": True,
            "explanation": explanation,
            "provider": request.Provider
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando explicación SHAP: {str(e)}")

@app.post("/explain-lime")
async def explain_prediction_lime(request: SinglePredictionRequest):
    """
    Genera explicación LIME para una predicción individual.
    """
    try:
        logger.info(f"LIME explanation request for provider: {request.Provider}")
        
        # Preparar features
        features = {
            'Total_Reimbursed': request.Total_Reimbursed,
            'Mean_Reimbursed': request.Total_Reimbursed / request.Claim_Count if request.Claim_Count > 0 else 0,
            'Claim_Count': request.Claim_Count,
            'Unique_Beneficiaries': request.Unique_Beneficiaries,
            'Pct_Male': request.Pct_Male
        }
        
        logger.info(f"Features prepared: {features}")
        
        # Generar explicación LIME
        logger.info("Calling LIME explainer...")
        explanation = lime_explainer.explain_prediction(features)
        logger.info(f"LIME explanation generated successfully: {explanation.get('explanation_type', 'Unknown')}")
        
        return {
            "success": True,
            "explanation": explanation,
            "provider": request.Provider
        }
    except Exception as e:
        logger.error(f"Error in LIME explanation endpoint: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generando explicación LIME: {str(e)}")

@app.get("/explain-bulk-shap")
async def explain_bulk_predictions_shap():
    """
    Genera explicaciones SHAP para todas las predicciones del archivo test_final.csv.
    """
    try:
        csv_path = "data/test_final/test_final.csv"
        if not os.path.exists(csv_path):
            raise HTTPException(
                status_code=404,
                detail="No se encontró el archivo test_final.csv. Ejecute /ingest primero."
            )
        
        explanations = shap_explainer.explain_multiple_predictions(csv_path)
        
        return {
            "success": True,
            "explanations": explanations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando explicaciones SHAP: {str(e)}")

@app.get("/compare-explanations/{provider_name}")
async def compare_explanations(provider_name: str):
    """
    Compara explicaciones SHAP y LIME para un proveedor específico.
    """
    try:
        # Buscar el proveedor en test_final.csv
        csv_path = "data/test_final/test_final.csv"
        if not os.path.exists(csv_path):
            raise HTTPException(
                status_code=404,
                detail="No se encontró el archivo test_final.csv. Ejecute /ingest primero."
            )
        
        df = pd.read_csv(csv_path)
        provider_data = df[df['Provider'] == provider_name]
        
        if provider_data.empty:
            raise HTTPException(status_code=404, detail=f"Proveedor '{provider_name}' no encontrado")
        
        # Preparar features
        row = provider_data.iloc[0]
        features = {
            'Total_Reimbursed': float(row['Total_Reimbursed']),
            'Mean_Reimbursed': float(row['Mean_Reimbursed']),
            'Claim_Count': int(row['Claim_Count']),
            'Unique_Beneficiaries': int(row['Unique_Beneficiaries']),
            'Pct_Male': float(row['Pct_Male'])
        }
        
        # Generar explicaciones con manejo de errores individual
        shap_explanation = None
        lime_explanation = None
        
        try:
            shap_explanation = shap_explainer.explain_prediction(features)
        except Exception as shap_err:
            logger.error(f"Error en SHAP explanation: {shap_err}")
            shap_explanation = {"error": "SHAP explanation failed", "feature_contributions": []}
        
        try:
            lime_explanation = lime_explainer.explain_prediction(features)
        except Exception as lime_err:
            logger.error(f"Error en LIME explanation: {lime_err}")
            lime_explanation = {"error": "LIME explanation failed", "feature_contributions": []}
        
        # Comparar explicaciones
        comparison = {
            'provider': provider_name,
            'features': features,
            'shap_explanation': shap_explanation,
            'lime_explanation': lime_explanation,
            'comparison_summary': {
                'shap_top_features': [f['feature'] for f in (shap_explanation.get('feature_contributions', [])[:3] if shap_explanation and 'error' not in shap_explanation else [])],
                'lime_top_features': [f['feature'] for f in (lime_explanation.get('feature_contributions', [])[:3] if lime_explanation and 'error' not in lime_explanation else [])],
                'agreement': 0  # Se calculará si ambas explicaciones están disponibles
            }
        }
        
        # Calcular agreement solo si ambas explicaciones están disponibles
        if (shap_explanation and 'error' not in shap_explanation and 
            lime_explanation and 'error' not in lime_explanation):
            shap_features = set([f['feature'] for f in shap_explanation.get('feature_contributions', [])[:3]])
            lime_features = set([f['feature'] for f in lime_explanation.get('feature_contributions', [])[:3]])
            comparison['comparison_summary']['agreement'] = len(shap_features & lime_features)
        
        return {
            "success": True,
            "comparison": comparison
        }
    except Exception as e:
        logger.error(f"Error en compare_explanations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error comparando explicaciones: {str(e)}")

@app.post("/chatbot/analyze")
async def chatbot_analyze(request: Dict[str, Any]):
    """
    Endpoint del chatbot con Gemini AI para análisis de fraude.
    Incluye rate limiting para evitar explotar la API.
    """
    try:
        # Verificar rate limit
        if not gemini_rate_limiter.can_make_request():
            return {
                "success": False,
                "error": "Rate limit exceeded. Please try again later.",
                "rate_limit_info": {
                    "max_requests_per_hour": gemini_rate_limiter.max_requests,
                    "current_requests": len(gemini_rate_limiter.requests)
                }
            }
        
        # Extraer datos del request
        context = request.get('context', {})
        user_message = request.get('message', '')
        
        # Construir prompt para Gemini
        prompt = _build_gemini_prompt(context, user_message)
        
        # Llamar a Gemini AI (con manejo de errores)
        try:
            response = _call_gemini_api(prompt)
            return {
                "success": True,
                "response": response,
                "rate_limit_info": {
                    "requests_remaining": gemini_rate_limiter.max_requests - len(gemini_rate_limiter.requests)
                }
            }
        except Exception as api_error:
            logger.error(f"Error calling Gemini API: {api_error}")
            return {
                "success": False,
                "error": "AI service temporarily unavailable",
                "fallback_response": _get_fallback_response(context, user_message)
            }
            
    except Exception as e:
        logger.error(f"Error in chatbot_analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en chatbot: {str(e)}")

def _build_gemini_prompt(context: Dict, user_message: str) -> str:
    """Construye el prompt para Gemini basado en el contexto"""
    prompt = f"""
    Eres un asistente experto en detección de fraude médico. Analiza los siguientes datos y responde la pregunta del usuario de manera clara y profesional.

    CONTEXTO:
    - Tipo de análisis: {'Predicción individual' if 'prediction' in context else 'Análisis de proveedor'}
    """
    
    if 'prediction' in context:
        pred = context['prediction']
        prompt += f"""
        - Proveedor: {pred.get('Provider', 'N/A')}
        - Probabilidad de fraude: {(pred.get('Probabilidad_Fraude', 0) * 100):.1f}%
        - Resultado: {'FRAUDE DETECTADO' if pred.get('Prediccion') == 1 else 'NO FRAUDE'}
        """
    
    if 'features' in context:
        features = context['features']
        prompt += f"""
        - Características del proveedor:
          * Total Reembolsado: ${features.get('Total_Reimbursed', 0):,.2f}
          * Número de reclamos: {features.get('Claim_Count', 0):,}
          * Beneficiarios únicos: {features.get('Unique_Beneficiaries', 0):,}
          * Porcentaje masculino: {features.get('Pct_Male', 0) * 100:.1f}%
        """
    
    if 'explanations' in context:
        explanations = context['explanations']
        prompt += f"""
        - Explicaciones del modelo:
          * LIME: {explanations.get('lime', 'No disponible')}
          * SHAP: {explanations.get('shap', 'No disponible')}
        """
    
    prompt += f"""
    
    PREGUNTA DEL USUARIO: {user_message}
    
    Responde de manera clara, profesional y útil. Si no tienes suficiente información, indícalo.
    """
    
    return prompt

def _call_gemini_api(prompt: str) -> str:
    """Llama a la API de Gemini (implementación básica)"""
    # NOTA: Esta es una implementación básica. En producción, usarías la librería oficial de Google
    api_key = "API_KEY"
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    
    headers = {
        "Content-Type": "application/json",
    }
    
    data = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    response = requests.post(f"{url}?key={api_key}", headers=headers, json=data)
    
    if response.status_code == 200:
        result = response.json()
        return result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No response')
    else:
        raise Exception(f"Gemini API error: {response.status_code}")

def _get_fallback_response(context: Dict, user_message: str) -> str:
    """Respuesta de fallback cuando Gemini no está disponible"""
    return f"""
    Lo siento, el servicio de IA no está disponible en este momento. 
    
    Basándome en los datos disponibles, puedo ayudarte con:
    - Análisis de las características del proveedor
    - Interpretación de las métricas de fraude
    - Explicación de los resultados del modelo
    
    ¿Qué aspecto específico te gustaría que analice?
    """

@app.get("/test-lime")
async def test_lime():
    """
    Endpoint de prueba para verificar que LIME funciona.
    """
    try:
        logger.info("Testing LIME explainer...")
        
        # Datos de prueba
        features = {
            'Total_Reimbursed': 50000,
            'Mean_Reimbursed': 50,
            'Claim_Count': 1000,
            'Unique_Beneficiaries': 500,
            'Pct_Male': 0.5
        }
        
        logger.info(f"Test features: {features}")
        
        # Probar el explainer
        explanation = lime_explainer.explain_prediction(features)
        
        logger.info(f"LIME test successful: {explanation.get('explanation_type', 'Unknown')}")
        
        return {
            "success": True,
            "explanation": explanation,
            "test": "LIME explainer is working"
        }
    except Exception as e:
        logger.error(f"LIME test failed: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "error": str(e),
            "test": "LIME explainer failed"
        }

@app.post("/ai-assistant/chat")
async def ai_assistant_endpoint(
    user_message: str = Body(..., embed=True),
    context: dict = Body({}, embed=True)
):
    """
    Endpoint para interactuar con el AI Assistant especializado en fraude médico.
    """
    return await ai_assistant_chat(user_message, context)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 