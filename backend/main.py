from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
import json
from typing import List, Dict, Any
import logging
import pandas as pd
from pydantic import BaseModel

# Importar agentes
from agents.ingestor import DataIngestor, process_test_files
from agents.predictor import FraudPredictor
from agents.dashboard_ingestor import process_dashboard_files

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 