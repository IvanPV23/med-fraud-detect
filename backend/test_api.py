#!/usr/bin/env python3
"""
Script de prueba para verificar el funcionamiento de la API de detección de fraude médico.
"""

import requests
import json
import os
import time

# Configuración
API_BASE_URL = "http://localhost:8000"
TEST_CSV_PATH = "../frontend/public/data/sample-providers.csv"

def test_health_check():
    """Prueba el endpoint de health check"""
    print("🔍 Probando health check...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check exitoso: {data}")
            return True
        else:
            print(f"❌ Health check falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error en health check: {e}")
        return False

def test_upload():
    """Prueba el endpoint de upload"""
    print("\n📤 Probando upload de archivo...")
    try:
        if not os.path.exists(TEST_CSV_PATH):
            print(f"❌ Archivo de prueba no encontrado: {TEST_CSV_PATH}")
            return False
        
        with open(TEST_CSV_PATH, 'rb') as f:
            files = {'file': ('sample-providers.csv', f, 'text/csv')}
            response = requests.post(f"{API_BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Upload exitoso: {data}")
            return True
        else:
            print(f"❌ Upload falló: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en upload: {e}")
        return False

def test_ingest():
    """Prueba el endpoint de ingest"""
    print("\n🔄 Probando procesamiento de datos...")
    try:
        response = requests.post(f"{API_BASE_URL}/ingest")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Procesamiento exitoso: {data}")
            return True
        else:
            print(f"❌ Procesamiento falló: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en procesamiento: {e}")
        return False

def test_predict():
    """Prueba el endpoint de predicción"""
    print("\n🔮 Probando predicciones...")
    try:
        response = requests.post(f"{API_BASE_URL}/predict")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Predicciones exitosas: {len(data['predictions'])} providers analizados")
            
            # Mostrar algunas predicciones de ejemplo
            for i, pred in enumerate(data['predictions'][:5]):
                print(f"   {pred['Provider']}: {'FRAUDE' if pred['Prediccion'] == 1 else 'NO FRAUDE'} ({pred['Probabilidad_Fraude']:.2%})")
            
            return True
        else:
            print(f"❌ Predicciones fallaron: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en predicciones: {e}")
        return False

def test_metrics():
    """Prueba el endpoint de métricas"""
    print("\n📊 Probando obtención de métricas...")
    try:
        response = requests.get(f"{API_BASE_URL}/metricas")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Métricas obtenidas exitosamente")
            print(f"   ROC-AUC: {data['metrics']['roc_auc']:.4f}")
            print(f"   Precision: {data['metrics']['precision']:.4f}")
            print(f"   Recall: {data['metrics']['recall']:.4f}")
            print(f"   F1-Score: {data['metrics']['f1_score']:.4f}")
            return True
        else:
            print(f"❌ Obtención de métricas falló: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error obteniendo métricas: {e}")
        return False

def main():
    """Función principal que ejecuta todas las pruebas"""
    print("🚀 Iniciando pruebas de la API de Detección de Fraude Médico")
    print("=" * 60)
    
    # Verificar que el servidor esté corriendo
    if not test_health_check():
        print("\n❌ El servidor no está respondiendo. Asegúrate de que esté corriendo en http://localhost:8000")
        return
    
    # Ejecutar pruebas en secuencia
    tests = [
        ("Upload", test_upload),
        ("Ingest", test_ingest),
        ("Predict", test_predict),
        ("Metrics", test_metrics)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Error inesperado en {test_name}: {e}")
            results.append((test_name, False))
    
    # Resumen de resultados
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASÓ" if success else "❌ FALLÓ"
        print(f"{test_name:15} {status}")
        if success:
            passed += 1
    
    print(f"\nResultado: {passed}/{len(results)} pruebas pasaron")
    
    if passed == len(results):
        print("🎉 ¡Todas las pruebas pasaron! El sistema está funcionando correctamente.")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa los errores arriba.")

if __name__ == "__main__":
    main() 