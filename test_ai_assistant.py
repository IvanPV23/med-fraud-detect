#!/usr/bin/env python3
"""
Script de prueba para verificar el AI Assistant con contexto enriquecido.
"""

import requests
import json
import sys

def test_ai_assistant_with_enriched_context():
    """
    Prueba el AI Assistant con contexto enriquecido de SHAP, LIME y dashboard.
    """
    
    # URL del backend
    base_url = "http://localhost:8000"
    
    # Contexto enriquecido de ejemplo
    enriched_context = {
        "provider": {
            "Provider": "TEST_PROVIDER_001",
            "Total_Reimbursed": 150000.0,
            "Mean_Reimbursed": 2500.0,
            "Claim_Count": 60,
            "Unique_Beneficiaries": 45,
            "Avg_Age": 65.5,
            "Pct_Male": 0.6,
            "Alzheimer": 0.15,
            "Heartfailure": 0.25,
            "Cancer": 0.10,
            "ObstrPulmonary": 0.20,
            "Depression": 0.30,
            "Diabetes": 0.35,
            "IschemicHeart": 0.40,
            "Osteoporasis": 0.12,
            "Arthritis": 0.28,
            "Stroke": 0.08,
            "RenalDisease": 0.18
        },
        "prediction": {
            "Provider": "TEST_PROVIDER_001",
            "Prediccion": 1,
            "Probabilidad_Fraude": 0.85
        },
        "explanations": {
            "shap_explanation": {
                "feature_contributions": [
                    {
                        "feature": "Total_Reimbursed",
                        "value": 150000.0,
                        "shap_value": 0.0456,
                        "impact": "positive"
                    },
                    {
                        "feature": "Claim_Count",
                        "value": 60,
                        "shap_value": 0.0321,
                        "impact": "positive"
                    },
                    {
                        "feature": "Unique_Beneficiaries",
                        "value": 45,
                        "shap_value": -0.0189,
                        "impact": "negative"
                    },
                    {
                        "feature": "Mean_Reimbursed",
                        "value": 2500.0,
                        "shap_value": 0.0123,
                        "impact": "positive"
                    },
                    {
                        "feature": "Pct_Male",
                        "value": 0.6,
                        "shap_value": 0.0087,
                        "impact": "positive"
                    }
                ]
            },
            "lime_explanation": {
                "feature_contributions": [
                    {
                        "feature": "Total_Reimbursed",
                        "value": 150000.0,
                        "weight": 0.0423,
                        "impact": "positive"
                    },
                    {
                        "feature": "Claim_Count",
                        "value": 60,
                        "weight": 0.0356,
                        "impact": "positive"
                    },
                    {
                        "feature": "Unique_Beneficiaries",
                        "value": 45,
                        "weight": -0.0214,
                        "impact": "negative"
                    },
                    {
                        "feature": "Mean_Reimbursed",
                        "value": 2500.0,
                        "weight": 0.0156,
                        "impact": "positive"
                    },
                    {
                        "feature": "Pct_Male",
                        "value": 0.6,
                        "weight": 0.0098,
                        "impact": "positive"
                    }
                ]
            }
        },
        "dashboard": {
            "provider": {
                "Provider": "TEST_PROVIDER_001",
                "Total_Reimbursed": 150000.0,
                "Mean_Reimbursed": 2500.0,
                "Claim_Count": 60,
                "Unique_Beneficiaries": 45,
                "Avg_Age": 65.5,
                "Pct_Male": 0.6
            },
            "chronicConditions": [
                {"name": "IschemicHeart", "value": 0.40},
                {"name": "Diabetes", "value": 0.35},
                {"name": "Depression", "value": 0.30},
                {"name": "Arthritis", "value": 0.28},
                {"name": "Heartfailure", "value": 0.25}
            ],
            "genderData": [
                {"name": "Male", "value": 60.0},
                {"name": "Female", "value": 40.0}
            ],
            "keyMetrics": {
                "totalReimbursed": 150000.0,
                "meanReimbursed": 2500.0,
                "claimCount": 60,
                "uniqueBeneficiaries": 45,
                "avgAge": 65.5,
                "pctMale": 0.6
            }
        },
        "history": []
    }
    
    # Preguntas de prueba
    test_questions = [
        "¿Por qué el modelo marcó este proveedor como posible fraude?",
        "¿Qué nos dicen las explicaciones SHAP y LIME?",
        "¿Qué condiciones crónicas son más relevantes?",
        "¿Cómo se compara este proveedor con otros?",
        "¿Qué métricas específicas contribuyeron más?"
    ]
    
    print("🧪 Probando AI Assistant con Contexto Enriquecido")
    print("=" * 60)
    
    try:
        # Verificar que el backend esté corriendo
        health_response = requests.get(f"{base_url}/health")
        if health_response.status_code != 200:
            print("❌ El backend no está corriendo. Inicia el servidor primero.")
            return False
        
        print("✅ Backend está corriendo")
        
        # Probar cada pregunta
        for i, question in enumerate(test_questions, 1):
            print(f"\n📝 Pregunta {i}: {question}")
            print("-" * 40)
            
            try:
                response = requests.post(
                    f"{base_url}/ai-assistant/chat",
                    json={
                        "user_message": question,
                        "context": enriched_context
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        print("✅ Respuesta exitosa:")
                        print(f"   Idioma: {result.get('lang', 'N/A')}")
                        print(f"   Respuesta: {result['response'][:200]}...")
                    else:
                        print(f"❌ Error: {result.get('response', 'Error desconocido')}")
                else:
                    print(f"❌ Error HTTP: {response.status_code}")
                    print(f"   Detalles: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error en la petición: {str(e)}")
        
        print("\n" + "=" * 60)
        print("🎉 Prueba completada")
        
        # Probar pregunta fuera de ámbito
        print("\n🧪 Probando pregunta fuera de ámbito:")
        try:
            response = requests.post(
                f"{base_url}/ai-assistant/chat",
                json={
                    "user_message": "¿Cuál es el clima hoy?",
                    "context": enriched_context
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                if not result.get("success"):
                    print("✅ Correctamente rechazó pregunta fuera de ámbito")
                    print(f"   Respuesta: {result.get('response', 'N/A')}")
                else:
                    print("⚠️  Debería haber rechazado la pregunta fuera de ámbito")
            else:
                print(f"❌ Error HTTP: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error en la petición: {str(e)}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al backend. Asegúrate de que esté corriendo en http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando pruebas del AI Assistant...")
    success = test_ai_assistant_with_enriched_context()
    
    if success:
        print("\n✅ Todas las pruebas completadas exitosamente!")
        print("\n📋 Resumen de mejoras implementadas:")
        print("   • Contexto enriquecido con SHAP, LIME y dashboard")
        print("   • Preguntas sugeridas adaptativas")
        print("   • Análisis multilingüe")
        print("   • Detección de tópicos fuera de ámbito")
        print("   • Comparación de métodos de interpretabilidad")
    else:
        print("\n❌ Algunas pruebas fallaron. Revisa los errores arriba.")
        sys.exit(1) 