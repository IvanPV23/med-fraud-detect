import pandas as pd
import numpy as np
import os
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_dashboard_files():
    """
    Procesa los archivos de test para generar test_dashboard.csv con columnas específicas para dashboard
    """
    # Rutas de archivos
    INPUT_DIR = Path(__file__).parent.parent / "data" / "test_uploaded"
    OUTPUT_DIR = Path(__file__).parent.parent / "data" / "test_dashboard"
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    try:
        # Leer archivos
        logger.info("Cargando archivos de test para dashboard...")
        
        # Buscar archivos por tipo
        beneficiary_files = list(INPUT_DIR.glob("*Beneficiary*.csv"))
        inpatient_files = list(INPUT_DIR.glob("*Inpatient*.csv"))
        outpatient_files = list(INPUT_DIR.glob("*Outpatient*.csv"))
        
        if not beneficiary_files or not inpatient_files or not outpatient_files:
            logger.error("No se encontraron todos los archivos necesarios")
            return False
        
        # Cargar archivos
        beneficiary = pd.read_csv(beneficiary_files[0])
        inpatient = pd.read_csv(inpatient_files[0])
        outpatient = pd.read_csv(outpatient_files[0])
        
        logger.info(f"Archivos cargados: {len(inpatient)} inpatient, {len(outpatient)} outpatient, {len(beneficiary)} beneficiary")
        
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
        
        # Agregaciones por proveedor para dashboard según especificación
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
            # Si no hay Age, intentar calcular desde DOB
            if 'DOB' in claims.columns:
                try:
                    claims['DOB'] = pd.to_datetime(claims['DOB'], errors='coerce')
                    reference_date = pd.to_datetime("2009-01-01")
                    claims['Age'] = ((reference_date - claims['DOB']).dt.days / 365.25).astype(int)
                    agg_dict['Age'] = 'mean'
                    logger.info("Age calculado desde DOB")
                except Exception as e:
                    logger.warning(f"No se pudo calcular Age desde DOB: {e}")
                    agg_dict['Age'] = lambda x: 65.0  # Valor por defecto
            else:
                agg_dict['Age'] = lambda x: 65.0  # Valor por defecto
                logger.warning("Age no encontrado en claims, usando valor por defecto")
        
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
        output_file = OUTPUT_DIR / "test_dashboard.csv"
        agg_by_provider.to_csv(output_file, index=False)
        
        logger.info(f"Dashboard generado exitosamente: {output_file}")
        logger.info(f"Proveedores procesados: {len(agg_by_provider)}")
        logger.info(f"Columnas generadas: {list(agg_by_provider.columns)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error procesando archivos para dashboard: {e}")
        return False

if __name__ == "__main__":
    process_dashboard_files() 