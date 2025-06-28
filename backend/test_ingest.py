#!/usr/bin/env python3
"""
Script de prueba para verificar que ambos ingestores funcionen correctamente.
"""

import os
import sys
import pandas as pd
from agents.ingestor import process_test_files
from agents.dashboard_ingestor import process_dashboard_files

def test_ingestors():
    """Prueba ambos ingestores y verifica que generen los archivos correctos."""
    
    print("=== PRUEBA DE INGESTORES ===")
    
    # Verificar que existan los archivos de entrada
    test_files = [
        "data/test_uploaded/Test.csv",
        "data/test_uploaded/Test_Beneficiarydata.csv", 
        "data/test_uploaded/Test_Inpatientdata.csv",
        "data/test_uploaded/Test_Outpatientdata.csv"
    ]
    
    print("\n1. Verificando archivos de entrada...")
    for file_path in test_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path) / 1024  # KB
            print(f"   ✓ {file_path} ({size:.1f} KB)")
        else:
            print(f"   ✗ {file_path} - NO ENCONTRADO")
            return False
    
    # Ejecutar ingestor normal
    print("\n2. Ejecutando ingestor normal...")
    try:
        process_test_files()
        print("   ✓ Ingestor normal completado")
    except Exception as e:
        print(f"   ✗ Error en ingestor normal: {e}")
        return False
    
    # Verificar test_final.csv
    test_final_path = "data/test_final/test_final.csv"
    if os.path.exists(test_final_path):
        df_final = pd.read_csv(test_final_path)
        print(f"   ✓ test_final.csv generado: {len(df_final)} filas, {len(df_final.columns)} columnas")
        print(f"   Columnas: {list(df_final.columns)}")
    else:
        print("   ✗ test_final.csv no encontrado")
        return False
    
    # Ejecutar ingestor de dashboard
    print("\n3. Ejecutando ingestor de dashboard...")
    try:
        success = process_dashboard_files()
        if success:
            print("   ✓ Ingestor de dashboard completado")
        else:
            print("   ✗ Ingestor de dashboard falló")
            return False
    except Exception as e:
        print(f"   ✗ Error en ingestor de dashboard: {e}")
        return False
    
    # Verificar test_dashboard.csv
    test_dashboard_path = "data/test_dashboard/test_dashboard.csv"
    if os.path.exists(test_dashboard_path):
        df_dashboard = pd.read_csv(test_dashboard_path)
        print(f"   ✓ test_dashboard.csv generado: {len(df_dashboard)} filas, {len(df_dashboard.columns)} columnas")
        print(f"   Columnas: {list(df_dashboard.columns)}")
    else:
        print("   ✗ test_dashboard.csv no encontrado")
        return False
    
    # Verificar que ambos archivos tengan el mismo número de proveedores
    if len(df_final) == len(df_dashboard):
        print(f"\n4. ✓ Ambos archivos tienen {len(df_final)} proveedores")
    else:
        print(f"\n4. ✗ Inconsistencia: test_final.csv tiene {len(df_final)} proveedores, test_dashboard.csv tiene {len(df_dashboard)}")
        return False
    
    # Verificar columnas específicas
    print("\n5. Verificando columnas específicas...")
    
    # test_final.csv debe tener columnas básicas para predicción
    required_final_columns = ['Provider', 'Total_Reimbursed', 'Mean_Reimbursed', 'Claim_Count', 'Unique_Beneficiaries', 'Pct_Male']
    for col in required_final_columns:
        if col in df_final.columns:
            print(f"   ✓ test_final.csv tiene columna: {col}")
        else:
            print(f"   ✗ test_final.csv falta columna: {col}")
            return False
    
    # test_dashboard.csv debe tener columnas detalladas para dashboard
    required_dashboard_columns = ['Provider', 'Total_Reimbursed', 'Claim_Count', 'Unique_Beneficiaries', 'Pct_Male']
    for col in required_dashboard_columns:
        if col in df_dashboard.columns:
            print(f"   ✓ test_dashboard.csv tiene columna: {col}")
        else:
            print(f"   ✗ test_dashboard.csv falta columna: {col}")
            return False
    
    print("\n=== PRUEBA COMPLETADA EXITOSAMENTE ===")
    return True

if __name__ == "__main__":
    success = test_ingestors()
    sys.exit(0 if success else 1) 