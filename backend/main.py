from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
import json
from typing import List, Dict, Any
import logging
import pandas as pd

# Importar agentes
from agents.ingestor import DataIngestor, process_test_files
from agents.predictor import FraudPredictor

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    Procesa los 4 archivos de test en data/test_uploaded/ y genera test_final.csv real.
    """
    try:
        process_test_files()
        return {"success": True, "message": "Procesamiento de archivos de test completado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en procesamiento: {str(e)}")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 