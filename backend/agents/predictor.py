import pandas as pd
import joblib
import os
import numpy as np
from typing import List, Dict, Any, Tuple

def convert_numpy_types(obj):
    """Convierte tipos numpy a tipos nativos de Python para serialización JSON"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

class FraudPredictor:
    """
    Agente para cargar el modelo XGBoost y realizar predicciones de fraude médico.
    """
    
    def __init__(self, model_path: str = "models/xgb_fraud_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.feature_names = [
            'Total_Reimbursed', 'Mean_Reimbursed', 'Claim_Count', 
            'Unique_Beneficiaries', 'Pct_Male', 'Avg_Beneficiary_Age'
        ]
        
        # Cargar modelo al inicializar
        self._load_model()
    
    def _load_model(self):
        """Carga el modelo XGBoost desde el archivo .pkl"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Modelo no encontrado en: {self.model_path}")
            
            self.model = joblib.load(self.model_path)
            
        except Exception as e:
            raise
    
    def predict_from_csv(self, csv_path: str) -> List[Dict[str, Any]]:
        """
        Realiza predicciones desde un archivo CSV procesado.
        
        Args:
            csv_path: Ruta al archivo CSV procesado (test_final.csv)
            
        Returns:
            Lista de diccionarios con predicciones por Provider
        """
        try:
            # Leer datos procesados
            df = pd.read_csv(csv_path)
            
            # Validar columnas requeridas
            required_columns = ['Provider'] + self.feature_names
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Columnas faltantes en CSV: {missing_columns}")
            
            # Preparar features para predicción
            X = df[self.feature_names]
            
            # Realizar predicciones
            assert self.model is not None
            predictions = self.model.predict(X)
            probabilities = self.model.predict_proba(X)
            
            # Crear resultados
            results = []
            for i, provider in enumerate(df['Provider']):
                # Convertir todos los valores numpy a tipos nativos de Python
                fraud_prob = float(probabilities[i][1])  # Convertir a float nativo de Python
                prediction = int(predictions[i])  # Convertir predicción a int nativo
                
                results.append({
                    'Provider': str(provider),  # Asegurar que sea string
                    'Prediccion': prediction,
                    'Probabilidad_Fraude': float(round(fraud_prob, 4))
                })
            
            return convert_numpy_types(results)  # type: ignore
            
        except Exception as e:
            raise
    
    def predict_from_dataframe(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Realiza predicciones desde un DataFrame.
        
        Args:
            df: DataFrame con datos procesados
            
        Returns:
            Lista de diccionarios con predicciones por Provider
        """
        try:
            # Validar columnas requeridas
            required_columns = ['Provider'] + self.feature_names
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Columnas faltantes: {missing_columns}")
            
            # Preparar features para predicción
            X = df[self.feature_names]
            
            # Realizar predicciones
            assert self.model is not None
            predictions = self.model.predict(X)
            probabilities = self.model.predict_proba(X)
            
            # Crear resultados
            results = []
            for i, provider in enumerate(df['Provider']):
                # Convertir todos los valores numpy a tipos nativos de Python
                fraud_prob = float(probabilities[i][1])  # Convertir a float nativo de Python
                prediction = int(predictions[i])  # Convertir predicción a int nativo
                
                results.append({
                    'Provider': str(provider),  # Asegurar que sea string
                    'Prediccion': prediction,
                    'Probabilidad_Fraude': float(round(fraud_prob, 4))
                })
            
            return convert_numpy_types(results)  # type: ignore
            
        except Exception as e:
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Retorna información sobre el modelo cargado.
        
        Returns:
            Dict con información del modelo
        """
        if self.model is None:
            return {"error": "Modelo no cargado"}
        
        return {
            "model_type": type(self.model).__name__,
            "feature_names": self.feature_names,
            "n_features": len(self.feature_names),
            "model_path": self.model_path
        }

# Función de conveniencia para uso directo
def predict_fraud(csv_path: str) -> List[Dict[str, Any]]:
    """
    Función de conveniencia para realizar predicciones.
    
    Args:
        csv_path: Ruta al archivo CSV procesado
        
    Returns:
        Lista de predicciones
    """
    predictor = FraudPredictor()
    return predictor.predict_from_csv(csv_path) 