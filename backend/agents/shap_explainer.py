import pandas as pd
import numpy as np
import joblib
import os
import shap
from typing import Dict, List, Any, Tuple
import json
from .predictor import FraudPredictor

class SHAPExplainer:
    """
    Agente para generar explicaciones SHAP del modelo de detección de fraude.
    """
    
    def __init__(self, model_path: str = "models/xgb_fraud_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.explainer = None
        self.feature_names = [
            'Total_Reimbursed', 'Mean_Reimbursed', 'Claim_Count', 
            'Unique_Beneficiaries', 'Pct_Male'
        ]
        
        # Cargar modelo y crear explainer
        self._load_model()
        self._create_explainer()
    
    def _load_model(self):
        """Carga el modelo XGBoost"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Modelo no encontrado en: {self.model_path}")
            
            self.model = joblib.load(self.model_path)
            
        except Exception as e:
            raise
    
    def _create_explainer(self):
        """Crea el explainer SHAP para el modelo XGBoost"""
        try:
            # Para XGBoost, usar TreeExplainer que es más eficiente
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            raise
    
    def explain_prediction(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Genera explicación SHAP para una predicción individual.
        
        Args:
            features: Diccionario con los valores de las features
            
        Returns:
            Diccionario con la explicación SHAP
        """
        try:
            if self.model is None or self.explainer is None:
                raise ValueError("Modelo o explainer no están cargados")
                
            # Convertir features a array
            feature_values = [features[feature] for feature in self.feature_names]
            X = np.array([feature_values])
            
            # Calcular valores SHAP
            shap_values = self.explainer.shap_values(X)
            
            # Para clasificación binaria, shap_values puede ser una lista
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # Usar valores para clase positiva (fraude)
            
            # Crear explicación
            explanation = {
                'feature_names': self.feature_names,
                'feature_values': feature_values,
                'shap_values': shap_values[0].tolist(),  # Primer (y único) ejemplo
                'base_value': float(self.explainer.expected_value),
                'prediction': int(self.model.predict(X)[0]),
                'prediction_proba': float(self.model.predict_proba(X)[0][1])
            }
            
            # Calcular contribuciones por feature
            feature_contributions = []
            for i, feature in enumerate(self.feature_names):
                contribution = {
                    'feature': feature,
                    'value': feature_values[i],
                    'shap_value': float(shap_values[0][i]),
                    'impact': 'positive' if shap_values[0][i] > 0 else 'negative'
                }
                feature_contributions.append(contribution)
            
            # Ordenar por magnitud del valor SHAP
            feature_contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
            explanation['feature_contributions'] = feature_contributions
            
            return explanation
            
        except Exception as e:
            raise
    
    def explain_multiple_predictions(self, csv_path: str) -> Dict[str, Any]:
        """
        Genera explicaciones SHAP para múltiples predicciones desde CSV.
        
        Args:
            csv_path: Ruta al archivo CSV con datos
            
        Returns:
            Diccionario con explicaciones para todos los proveedores
        """
        try:
            if self.model is None or self.explainer is None:
                raise ValueError("Modelo o explainer no están cargados")
                
            # Leer datos
            df = pd.read_csv(csv_path)
            
            # Validar columnas
            required_columns = ['Provider'] + self.feature_names
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Columnas faltantes: {missing_columns}")
            
            # Preparar datos
            X = df[self.feature_names]
            
            # Calcular valores SHAP para todo el dataset
            shap_values = self.explainer.shap_values(X)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            
            # Crear explicaciones por proveedor
            explanations = {}
            for i, provider in enumerate(df['Provider']):
                provider_explanation = {
                    'provider': str(provider),
                    'feature_names': self.feature_names,
                    'feature_values': X.iloc[i].tolist(),
                    'shap_values': shap_values[i].tolist(),
                    'base_value': float(self.explainer.expected_value),
                    'prediction': int(self.model.predict(X.iloc[i:i+1])[0]),
                    'prediction_proba': float(self.model.predict_proba(X.iloc[i:i+1])[0][1])
                }
                
                # Contribuciones por feature
                feature_contributions = []
                for j, feature in enumerate(self.feature_names):
                    contribution = {
                        'feature': feature,
                        'value': X.iloc[i, j],
                        'shap_value': float(shap_values[i, j]),
                        'impact': 'positive' if shap_values[i, j] > 0 else 'negative'
                    }
                    feature_contributions.append(contribution)
                
                # Ordenar por magnitud
                feature_contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
                provider_explanation['feature_contributions'] = feature_contributions
                
                explanations[str(provider)] = provider_explanation
            
            return {
                'explanations': explanations,
                'total_providers': len(explanations),
                'base_value': float(self.explainer.expected_value)
            }
            
        except Exception as e:
            raise
    
    def get_feature_importance_summary(self, csv_path: str = None) -> Dict[str, Any]:
        """
        Genera un resumen de importancia de features basado en SHAP.
        
        Args:
            csv_path: Ruta opcional al CSV para calcular importancia en datos específicos
            
        Returns:
            Diccionario con resumen de importancia de features
        """
        try:
            if self.model is None:
                raise ValueError("Modelo no está cargado")
                
            if csv_path and os.path.exists(csv_path):
                # Calcular importancia en datos específicos
                if self.explainer is None:
                    raise ValueError("Explainer no está cargado")
                    
                df = pd.read_csv(csv_path)
                X = df[self.feature_names]
                shap_values = self.explainer.shap_values(X)
                if isinstance(shap_values, list):
                    shap_values = shap_values[1]
                
                # Calcular importancia promedio (valores absolutos)
                feature_importance = np.mean(np.abs(shap_values), axis=0)
            else:
                # Usar importancia del modelo (menos preciso pero más rápido)
                feature_importance = self.model.feature_importances_
            
            # Normalizar los valores para que sumen 1.0 (100%)
            total_importance = float(np.sum(feature_importance))
            if total_importance > 0:
                feature_importance = feature_importance / total_importance
            
            # Crear resumen
            importance_summary = []
            for i, feature in enumerate(self.feature_names):
                importance_summary.append({
                    'feature': feature,
                    'importance': float(feature_importance[i]),
                    'rank': 0  # Se calculará después
                })
            
            # Ordenar por importancia y asignar ranking
            importance_summary.sort(key=lambda x: x['importance'], reverse=True)
            for i, item in enumerate(importance_summary):
                item['rank'] = i + 1
            
            return {
                'feature_importance': importance_summary,
                'total_features': len(self.feature_names)
            }
            
        except Exception as e:
            raise

# Función de conveniencia
def explain_prediction_shap(features: Dict[str, float]) -> Dict[str, Any]:
    """
    Función de conveniencia para explicar una predicción individual.
    
    Args:
        features: Diccionario con valores de features
        
    Returns:
        Explicación SHAP
    """
    explainer = SHAPExplainer()
    return explainer.explain_prediction(features) 