import pandas as pd
import numpy as np
import os
from pathlib import Path
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_dashboard_data():
    """
    Genera test_dashboard.csv con estadísticas por proveedor para visualización
    según la especificación del usuario
    """
    # Rutas de archivos
    data_dir = Path(__file__).parent.parent / "data" / "test_uploaded"
    output_dir = Path(__file__).parent.parent / "data" / "test_dashboard"
    output_dir.mkdir(exist_ok=True)
    
    # Cargar archivos de test
    try:
        inpatient = pd.read_csv(data_dir / "Test_Inpatientdata.csv")
        outpatient = pd.read_csv(data_dir / "Test_Outpatientdata.csv")
        beneficiary = pd.read_csv(data_dir / "Test_Beneficiarydata.csv")
        logger.info(f"Archivos cargados: {len(inpatient)} inpatient, {len(outpatient)} outpatient, {len(beneficiary)} beneficiary")
    except FileNotFoundError as e:
        logger.error(f"Error: No se encontró el archivo {e}")
        return False
    
    # Limpieza de beneficiarios
    beneficiary = beneficiary.drop_duplicates('BeneID')
    
    # Concatenar inpatient y outpatient con una columna que indique el tipo
    inpatient['Type'] = 'inpatient'
    outpatient['Type'] = 'outpatient'
    claims = pd.concat([inpatient, outpatient], ignore_index=True)
    
    # Calcular Edad si existe DOB
    if 'DOB' in beneficiary.columns and 'DOD' in beneficiary.columns:
        beneficiary['DOB'] = pd.to_datetime(beneficiary['DOB'], errors='coerce')
        beneficiary['DOD'] = pd.to_datetime(beneficiary['DOD'], errors='coerce')
        
        reference_date = pd.to_datetime("2009-01-01")
        beneficiary['Age'] = ((reference_date - beneficiary['DOB']).dt.days / 365.25).astype(int)
        logger.info("Edad calculada desde DOB")
    
    # Elimina columnas ya existentes de beneficiary que están en claims
    cols_to_remove = beneficiary.columns.intersection(claims.columns).drop('BeneID')
    claims = claims.drop(columns=cols_to_remove.tolist())
    
    # Unir beneficiarios
    claims = claims.merge(beneficiary, on='BeneID', how='left')
    logger.info(f"Claims con beneficiarios: {len(claims)} registros")
    
    # Verificar columnas disponibles
    logger.info(f"Columnas en claims: {list(claims.columns)}")
    
    # Función para calcular porcentaje de hombres (Gender es 1=Masculino, 2=Femenino)
    def pct_male(genders):
        if len(genders) == 0:
            return 0.5
        return (genders == 1).mean()
    
    # Agregaciones por proveedor para features según especificación
    agg_dict = {
        'InscClaimAmtReimbursed': ['sum', 'mean'],
        'ClaimID': 'count',
        'BeneID': pd.Series.nunique,
    }
    
    # Agregar condiciones crónicas si existen
    chronic_conditions = [
        'ChronicCond_Alzheimer', 'ChronicCond_Heartfailure', 'ChronicCond_Cancer',
        'ChronicCond_ObstrPulmonary', 'ChronicCond_Depression', 'ChronicCond_Diabetes',
        'ChronicCond_IschemicHeart', 'ChronicCond_Osteoporasis', 'ChronicCond_rheumatoidarthritis',
        'ChronicCond_stroke'
    ]
    
    for condition in chronic_conditions:
        if condition in claims.columns:
            agg_dict[condition] = 'mean'
            logger.info(f"Agregando condición crónica: {condition}")
    
    # Agregar RenalDiseaseIndicator
    if 'RenalDiseaseIndicator' in claims.columns:
        agg_dict['RenalDiseaseIndicator'] = lambda x: (x == 'Y').mean()
        logger.info("Agregando RenalDiseaseIndicator")
    
    # Agregar Age
    if 'Age' in claims.columns:
        agg_dict['Age'] = 'mean'
        logger.info("Agregando Age")
    else:
        agg_dict['Age'] = lambda x: np.nan
        logger.warning("Age no encontrado en claims")
    
    # Agregar Gender usando la función pct_male
    if 'Gender' in claims.columns:
        agg_dict['Gender'] = pct_male
        logger.info("Agregando Gender con función pct_male")
    else:
        agg_dict['Gender'] = lambda x: 0.5
        logger.warning("Gender no encontrado en claims")
    
    # Realizar agregación
    agg_by_provider = claims.groupby('Provider').agg(agg_dict).reset_index()
    
    # Aplanar columnas multi-nivel si existen
    if isinstance(agg_by_provider.columns, pd.MultiIndex):
        agg_by_provider.columns = [f"{col[0]}_{col[1]}" if col[1] else col[0] 
                                 for col in agg_by_provider.columns]
    
    # Renombrar columnas según especificación exacta
    column_mapping = {
        'InscClaimAmtReimbursed_sum': 'Total_Reimbursed',
        'InscClaimAmtReimbursed_mean': 'Mean_Reimbursed',
        'ClaimID_count': 'Claim_Count',
        'BeneID_nunique': 'Unique_Beneficiaries',
        'Age_mean': 'Avg_Age',
        'Gender_pct_male': 'Pct_Male',
        'Gender_<lambda>': 'Pct_Male'
    }
    
    # Aplicar mapeo de columnas
    for old_col, new_col in column_mapping.items():
        if old_col in agg_by_provider.columns:
            agg_by_provider = agg_by_provider.rename(columns={old_col: new_col})
    
    # Renombrar condiciones crónicas según especificación
    chronic_mapping = {
        'ChronicCond_Alzheimer_mean': 'Alzheimer',
        'ChronicCond_Heartfailure_mean': 'Heartfailure',
        'ChronicCond_Cancer_mean': 'Cancer',
        'ChronicCond_ObstrPulmonary_mean': 'ObstrPulmonary',
        'ChronicCond_Depression_mean': 'Depression',
        'ChronicCond_Diabetes_mean': 'Diabetes',
        'ChronicCond_IschemicHeart_mean': 'IschemicHeart',
        'ChronicCond_Osteoporasis_mean': 'Osteoporasis',
        'ChronicCond_rheumatoidarthritis_mean': 'Arthritis',
        'ChronicCond_stroke_mean': 'Stroke'
    }
    
    for old_col, new_col in chronic_mapping.items():
        if old_col in agg_by_provider.columns:
            agg_by_provider = agg_by_provider.rename(columns={old_col: new_col})
    
    # Renombrar RenalDiseaseIndicator
    if 'RenalDiseaseIndicator_<lambda>' in agg_by_provider.columns:
        agg_by_provider = agg_by_provider.rename(columns={'RenalDiseaseIndicator_<lambda>': 'RenalDisease'})
    
    # Asegurar el orden correcto de columnas según especificación
    expected_columns = [
        'Provider', 'Total_Reimbursed', 'Mean_Reimbursed', 'Claim_Count', 'Unique_Beneficiaries',
        'Alzheimer', 'Heartfailure', 'Cancer', 'ObstrPulmonary', 'Depression',
        'Diabetes', 'IschemicHeart', 'Osteoporasis', 'Arthritis', 'Stroke',
        'RenalDisease', 'Avg_Age', 'Pct_Male'
    ]
    
    # Agregar columnas faltantes con valores por defecto
    for col in expected_columns:
        if col not in agg_by_provider.columns:
            if col in ['Alzheimer', 'Heartfailure', 'Cancer', 'ObstrPulmonary', 'Depression',
                      'Diabetes', 'IschemicHeart', 'Osteoporasis', 'Arthritis', 'Stroke', 'RenalDisease']:
                agg_by_provider[col] = 0.0
            elif col == 'Avg_Age':
                agg_by_provider[col] = 0.0
            elif col == 'Pct_Male':
                agg_by_provider[col] = 0.5
            else:
                agg_by_provider[col] = 0.0
    
    # Reordenar columnas según especificación
    available_columns = [col for col in expected_columns if col in agg_by_provider.columns]
    agg_by_provider = agg_by_provider[available_columns]
    
    # Limpiar valores nulos
    agg_by_provider = agg_by_provider.fillna(0)
    
    # Guardar archivo
    output_file = output_dir / "test_dashboard.csv"
    agg_by_provider.to_csv(output_file, index=False)
    
    logger.info(f"Dashboard generado exitosamente: {output_file}")
    logger.info(f"Proveedores procesados: {len(agg_by_provider)}")
    logger.info(f"Columnas generadas: {list(agg_by_provider.columns)}")
    
    return True

if __name__ == "__main__":
    generate_dashboard_data() 