import pandas as pd
import os
from typing import List, Dict, Any, Optional
import logging
import glob
import numpy as np

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataIngestor:
    """
    Agente para procesar múltiples archivos CSV y generar test_final.csv
    con las features requeridas por el modelo XGBoost.
    """
    
    def __init__(self, upload_dir: str = "data/uploads", output_dir: str = "data/processed"):
        self.upload_dir = upload_dir
        self.output_dir = output_dir
        self.required_features = [
            'Total_Reimbursed', 'Mean_Reimbursed', 'Claim_Count', 
            'Unique_Beneficiaries', 'Pct_Male'
        ]
        
        # Crear directorios si no existen
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    def process_multiple_files(self) -> Dict[str, Any]:
        """
        Procesa múltiples archivos CSV y genera test_final.csv consolidado.
        
        Returns:
            Dict con información del procesamiento
        """
        try:
            logger.info("Iniciando procesamiento de múltiples archivos")
            
            # Buscar archivos por tipo
            beneficiary_files = glob.glob(os.path.join(self.upload_dir, "*Beneficiary*.csv"))
            inpatient_files = glob.glob(os.path.join(self.upload_dir, "*Inpatient*.csv"))
            outpatient_files = glob.glob(os.path.join(self.upload_dir, "*Outpatient*.csv"))
            provider_files = glob.glob(os.path.join(self.upload_dir, "*Provider*.csv"))
            
            logger.info(f"Archivos encontrados:")
            logger.info(f"  Beneficiary: {len(beneficiary_files)}")
            logger.info(f"  Inpatient: {len(inpatient_files)}")
            logger.info(f"  Outpatient: {len(outpatient_files)}")
            logger.info(f"  Provider: {len(provider_files)}")
            
            # Procesar cada tipo de archivo
            beneficiary_data = self._process_beneficiary_files(beneficiary_files)
            inpatient_data = self._process_inpatient_files(inpatient_files)
            outpatient_data = self._process_outpatient_files(outpatient_files)
            provider_data = self._process_provider_files(provider_files)
            
            # Consolidar datos
            consolidated_df = self._consolidate_data(
                beneficiary_data, inpatient_data, outpatient_data, provider_data
            )
            
            # Crear features finales
            final_df = self._create_final_features(consolidated_df)
            
            # Guardar archivo procesado
            output_path = os.path.join(self.output_dir, "test_final.csv")
            final_df.to_csv(output_path, index=False)
            
            logger.info(f"Archivo consolidado guardado en: {output_path}")
            logger.info(f"Total de providers procesados: {len(final_df)}")
            
            return {
                "success": True,
                "message": "Archivos procesados exitosamente",
                "input_files": {
                    "beneficiary": len(beneficiary_files),
                    "inpatient": len(inpatient_files),
                    "outpatient": len(outpatient_files),
                    "provider": len(provider_files)
                },
                "output_rows": len(final_df),
                "output_path": output_path
            }
            
        except Exception as e:
            logger.error(f"Error procesando archivos: {str(e)}")
            return {
                "success": False,
                "message": f"Error procesando archivos: {str(e)}",
                "error": str(e)
            }
    
    def _process_beneficiary_files(self, files: List[str]) -> pd.DataFrame:
        """Procesa archivos de beneficiarios"""
        if not files:
            logger.warning("No se encontraron archivos de beneficiarios")
            return pd.DataFrame()
        
        all_data = []
        for file in files:
            try:
                df = pd.read_csv(file)
                logger.info(f"Procesando beneficiarios: {file} - {len(df)} filas")
                all_data.append(df)
            except Exception as e:
                logger.error(f"Error procesando {file}: {e}")
        
        if all_data:
            return pd.concat(all_data, ignore_index=True)
        return pd.DataFrame()
    
    def _process_inpatient_files(self, files: List[str]) -> pd.DataFrame:
        """Procesa archivos de pacientes internos"""
        if not files:
            logger.warning("No se encontraron archivos de pacientes internos")
            return pd.DataFrame()
        
        all_data = []
        for file in files:
            try:
                df = pd.read_csv(file)
                logger.info(f"Procesando pacientes internos: {file} - {len(df)} filas")
                all_data.append(df)
            except Exception as e:
                logger.error(f"Error procesando {file}: {e}")
        
        if all_data:
            return pd.concat(all_data, ignore_index=True)
        return pd.DataFrame()
    
    def _process_outpatient_files(self, files: List[str]) -> pd.DataFrame:
        """Procesa archivos de pacientes externos"""
        if not files:
            logger.warning("No se encontraron archivos de pacientes externos")
            return pd.DataFrame()
        
        all_data = []
        for file in files:
            try:
                df = pd.read_csv(file)
                logger.info(f"Procesando pacientes externos: {file} - {len(df)} filas")
                all_data.append(df)
            except Exception as e:
                logger.error(f"Error procesando {file}: {e}")
        
        if all_data:
            return pd.concat(all_data, ignore_index=True)
        return pd.DataFrame()
    
    def _process_provider_files(self, files: List[str]) -> pd.DataFrame:
        """Procesa archivos de proveedores"""
        if not files:
            logger.warning("No se encontraron archivos de proveedores")
            return pd.DataFrame()
        
        all_data = []
        for file in files:
            try:
                df = pd.read_csv(file)
                logger.info(f"Procesando proveedores: {file} - {len(df)} filas")
                all_data.append(df)
            except Exception as e:
                logger.error(f"Error procesando {file}: {e}")
        
        if all_data:
            return pd.concat(all_data, ignore_index=True)
        return pd.DataFrame()
    
    def _consolidate_data(self, beneficiary_df: pd.DataFrame, inpatient_df: pd.DataFrame, 
                         outpatient_df: pd.DataFrame, provider_df: pd.DataFrame) -> pd.DataFrame:
        """Consolida datos de diferentes fuentes"""
        
        # Si tenemos datos de proveedores, usarlos como base
        if not provider_df.empty:
            base_df = provider_df.copy()
            logger.info(f"Usando datos de proveedores como base: {len(base_df)} filas")
        else:
            # Crear DataFrame base con providers únicos de otros archivos
            providers = set()
            
            if not beneficiary_df.empty and 'Provider' in beneficiary_df.columns:
                providers.update(beneficiary_df['Provider'].unique())
            
            if not inpatient_df.empty and 'Provider' in inpatient_df.columns:
                providers.update(inpatient_df['Provider'].unique())
            
            if not outpatient_df.empty and 'Provider' in outpatient_df.columns:
                providers.update(outpatient_df['Provider'].unique())
            
            base_df = pd.DataFrame({'Provider': list(providers)})
            logger.info(f"Creando base con {len(base_df)} providers únicos")
        
        # Agregar datos de beneficiarios
        if not beneficiary_df.empty:
            try:
                beneficiary_stats = beneficiary_df.groupby('Provider').agg({
                    'BeneficiaryID': 'nunique' if 'BeneficiaryID' in beneficiary_df.columns else 'count',
                    'Gender': lambda x: (x == 'M').mean() if 'Gender' in beneficiary_df.columns else 0.5
                })
                if isinstance(beneficiary_stats, pd.DataFrame):
                    beneficiary_stats.columns = ['Unique_Beneficiaries', 'Pct_Male']
                    base_df = base_df.merge(beneficiary_stats, on='Provider', how='left')
            except Exception as e:
                logger.warning(f"Error procesando datos de beneficiarios: {e}")
        
        # Agregar datos de pacientes internos
        if not inpatient_df.empty:
            try:
                inpatient_stats = inpatient_df.groupby('Provider').agg({
                    'ClaimID': 'count' if 'ClaimID' in inpatient_df.columns else 'size',
                    'ClaimAmount': ['sum', 'mean'] if 'ClaimAmount' in inpatient_df.columns else ['sum', 'mean']
                }).reset_index()
                inpatient_stats.columns = ['Provider', 'Inpatient_Claims', 'Inpatient_Total', 'Inpatient_Mean']
                base_df = base_df.merge(inpatient_stats, on='Provider', how='left')
            except Exception as e:
                logger.warning(f"Error procesando datos de pacientes internos: {e}")
        
        # Agregar datos de pacientes externos
        if not outpatient_df.empty:
            try:
                outpatient_stats = outpatient_df.groupby('Provider').agg({
                    'ClaimID': 'count' if 'ClaimID' in outpatient_df.columns else 'size',
                    'ClaimAmount': ['sum', 'mean'] if 'ClaimAmount' in outpatient_df.columns else ['sum', 'mean']
                }).reset_index()
                outpatient_stats.columns = ['Provider', 'Outpatient_Claims', 'Outpatient_Total', 'Outpatient_Mean']
                base_df = base_df.merge(outpatient_stats, on='Provider', how='left')
            except Exception as e:
                logger.warning(f"Error procesando datos de pacientes externos: {e}")
        
        # Llenar valores NaN
        base_df = base_df.fillna(0)
        
        logger.info(f"Datos consolidados: {len(base_df)} providers")
        return base_df
    
    def _create_final_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Crea las features finales requeridas por el modelo"""
        
        # Crear features requeridas
        final_df = df.copy()
        
        # Inicializar features con valores por defecto
        final_df['Total_Reimbursed'] = 0.0
        final_df['Mean_Reimbursed'] = 0.0
        final_df['Claim_Count'] = 0.0
        final_df['Unique_Beneficiaries'] = 1.0
        final_df['Pct_Male'] = 0.5
        
        # Intentar calcular features si existen las columnas necesarias
        try:
            # Total_Reimbursed
            if 'Inpatient_Total' in final_df.columns:
                final_df['Total_Reimbursed'] += final_df['Inpatient_Total'].fillna(0)
            if 'Outpatient_Total' in final_df.columns:
                final_df['Total_Reimbursed'] += final_df['Outpatient_Total'].fillna(0)
            if 'TotalAmountReimbursed' in final_df.columns:
                final_df['Total_Reimbursed'] += final_df['TotalAmountReimbursed'].fillna(0)
            
            # Claim_Count
            if 'Inpatient_Claims' in final_df.columns:
                final_df['Claim_Count'] += final_df['Inpatient_Claims'].fillna(0)
            if 'Outpatient_Claims' in final_df.columns:
                final_df['Claim_Count'] += final_df['Outpatient_Claims'].fillna(0)
            if 'TotalClaims' in final_df.columns:
                final_df['Claim_Count'] += final_df['TotalClaims'].fillna(0)
            
            # Mean_Reimbursed
            mask = final_df['Claim_Count'] > 0
            final_df.loc[mask, 'Mean_Reimbursed'] = (
                final_df.loc[mask, 'Total_Reimbursed'] / final_df.loc[mask, 'Claim_Count']
            )
            
            # Unique_Beneficiaries
            if 'Unique_Beneficiaries' in final_df.columns:
                final_df['Unique_Beneficiaries'] = final_df['Unique_Beneficiaries'].fillna(1)
            
            # Pct_Male
            if 'Pct_Male' in final_df.columns:
                final_df['Pct_Male'] = final_df['Pct_Male'].fillna(0.5)
                
        except Exception as e:
            logger.warning(f"Error calculando features: {e}")
        
        # Seleccionar solo las columnas requeridas
        final_columns = ['Provider'] + self.required_features
        final_df = final_df[final_columns]
        
        # Limpiar datos
        final_df = final_df.fillna(0)
        
        # Asegurar tipos de datos correctos
        for feature in self.required_features:
            try:
                final_df[feature] = final_df[feature].astype(float)
            except Exception as e:
                logger.warning(f"Error convirtiendo feature {feature}: {e}")
                final_df[feature] = 0.0
        
        # Limitar a los primeros 30 providers para demo
        if len(final_df) > 30:
            final_df = final_df.head(30)
            logger.info("Limitando a los primeros 30 providers para demo")
        
        return final_df
    
    def process_csv_file(self, file_path: str) -> Dict[str, Any]:
        """
        Procesa un archivo CSV individual (método legacy para compatibilidad).
        
        Args:
            file_path: Ruta al archivo CSV a procesar
            
        Returns:
            Dict con información del procesamiento
        """
        try:
            logger.info(f"Procesando archivo individual: {file_path}")
            
            # Leer el archivo CSV
            df = pd.read_csv(file_path)
            logger.info(f"Archivo leído con {len(df)} filas y {len(df.columns)} columnas")
            
            # Si es un archivo de proveedores con formato esperado, procesarlo directamente
            if 'Provider' in df.columns and all(feature in df.columns for feature in self.required_features):
                # Ya tiene el formato correcto
                processed_df = df[['Provider'] + self.required_features].copy()
            else:
                # Procesar como archivo individual
                processed_df = self._create_features(df)
            
            # Guardar archivo procesado
            output_path = os.path.join(self.output_dir, "test_final.csv")
            processed_df.to_csv(output_path, index=False)
            
            logger.info(f"Archivo procesado guardado en: {output_path}")
            
            return {
                "success": True,
                "message": "Archivo procesado exitosamente",
                "input_rows": len(df),
                "output_rows": len(processed_df),
                "output_path": output_path
            }
            
        except Exception as e:
            logger.error(f"Error procesando archivo: {str(e)}")
            return {
                "success": False,
                "message": f"Error procesando archivo: {str(e)}",
                "error": str(e)
            }
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Crea las features requeridas por el modelo a partir de los datos brutos.
        
        Args:
            df: DataFrame con datos brutos
            
        Returns:
            DataFrame con features procesadas
        """
        # Crear copia para no modificar el original
        processed_df: pd.DataFrame = df.copy()
        
        # Feature 1: Total_Reimbursed (TotalAmountReimbursed)
        processed_df['Total_Reimbursed'] = processed_df.get('TotalAmountReimbursed', 0)
        
        # Feature 2: Mean_Reimbursed (MeanAmountReimbursed)
        processed_df['Mean_Reimbursed'] = processed_df.get('MeanAmountReimbursed', 0)
        
        # Feature 3: Claim_Count (TotalClaims)
        processed_df['Claim_Count'] = processed_df.get('TotalClaims', 0)
        
        # Feature 4: Unique_Beneficiaries (NumUniqueBeneficiaries)
        processed_df['Unique_Beneficiaries'] = processed_df.get('NumUniqueBeneficiaries', 1)
        
        # Feature 5: Pct_Male (simulado - en un caso real vendría de los datos)
        # Por ahora usamos un valor simulado basado en otros features
        processed_df['Pct_Male'] = 0.5 + (processed_df['Claim_Count'] % 100) / 200
        
        # Seleccionar solo las columnas requeridas
        final_columns = ['Provider'] + self.required_features
        processed_df = processed_df[final_columns]
        
        # Limpiar datos: reemplazar NaN con 0
        processed_df = processed_df.fillna(0)
        
        # Asegurar tipos de datos correctos
        for feature in self.required_features:
            processed_df[feature] = pd.to_numeric(processed_df[feature], errors='coerce').astype(float).fillna(0)
        
        return processed_df
    
    def get_processed_data(self) -> pd.DataFrame:
        """
        Lee el archivo test_final.csv procesado.
        
        Returns:
            DataFrame con datos procesados
        """
        output_path = os.path.join(self.output_dir, "test_final.csv")
        if os.path.exists(output_path):
            return pd.read_csv(output_path)
        else:
            raise FileNotFoundError("No se encontró el archivo test_final.csv. Ejecute el procesamiento primero.")

# Función de conveniencia para uso directo
def process_uploaded_file(file_path: str) -> Dict[str, Any]:
    """
    Función de conveniencia para procesar un archivo subido.
    
    Args:
        file_path: Ruta al archivo CSV
        
    Returns:
        Dict con resultado del procesamiento
    """
    ingestor = DataIngestor()
    return ingestor.process_csv_file(file_path)

def process_multiple_files() -> Dict[str, Any]:
    """
    Función de conveniencia para procesar múltiples archivos.
    
    Returns:
        Dict con resultado del procesamiento
    """
    ingestor = DataIngestor()
    return ingestor.process_multiple_files()

# Directorios de entrada y salida
INPUT_DIR = os.path.join(os.path.dirname(__file__), '../data/test_uploaded')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../data/test_final')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'test_final.csv')

# Nombres de archivos esperados
INPATIENT_FILE = 'Test_Inpatientdata.csv'
OUTPATIENT_FILE = 'Test_Outpatientdata.csv'
BENEFICIARY_FILE = 'Test_Beneficiarydata.csv'
PROVIDER_FILE = 'Test.csv'

# Asegurar directorio de salida
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_test_files():
    # Leer archivos
    beneficiary_file = os.path.join(INPUT_DIR, 'Test_Beneficiarydata.csv')
    inpatient_file = os.path.join(INPUT_DIR, 'Test_Inpatientdata.csv')
    outpatient_file = os.path.join(INPUT_DIR, 'Test_Outpatientdata.csv')
    provider_file = os.path.join(INPUT_DIR, 'Test.csv')
    
    # Verificar que existan los archivos
    files_exist = all(os.path.exists(f) for f in [beneficiary_file, inpatient_file, outpatient_file, provider_file])
    
    if not files_exist:
        logger.warning("No se encontraron todos los archivos de test. Generando datos simulados...")
        # Generar datos simulados para demo
        generate_demo_data()
    
    # Procesar archivos
    try:
        # Leer archivos
        beneficiary = pd.read_csv(beneficiary_file) if os.path.exists(beneficiary_file) else pd.DataFrame()
        inpatient = pd.read_csv(inpatient_file) if os.path.exists(inpatient_file) else pd.DataFrame()
        outpatient = pd.read_csv(outpatient_file) if os.path.exists(outpatient_file) else pd.DataFrame()
        provider = pd.read_csv(provider_file) if os.path.exists(provider_file) else pd.DataFrame()
        
        # Consolidar claims
        claims_list = []
        if not inpatient.empty:
            claims_list.append(inpatient)
        if not outpatient.empty:
            claims_list.append(outpatient)
        
        if not claims_list:
            logger.warning("No se encontraron datos de claims")
            return
        
        claims = pd.concat(claims_list, ignore_index=True)
        
        # Merge con beneficiarios si es posible
        if not beneficiary.empty and 'BeneID' in beneficiary.columns and 'BeneID' in claims.columns:
            # Seleccionar solo las columnas que existen
            beneficiary_columns = ['BeneID']
            if 'DOB' in beneficiary.columns:
                beneficiary_columns.append('DOB')
            if 'DOD' in beneficiary.columns:
                beneficiary_columns.append('DOD')
            if 'Gender' in beneficiary.columns:
                beneficiary_columns.append('Gender')
            
            claims = claims.merge(beneficiary[beneficiary_columns], on='BeneID', how='left')
        
        # Calcular edad si es posible
        if 'DOB' in claims.columns:
            claims['DOB'] = pd.to_datetime(claims['DOB'], errors='coerce')
            reference_date = pd.to_datetime("2009-01-01")
            claims['Age'] = ((reference_date - claims['DOB']).dt.days / 365.25).fillna(0).astype(int)
        
        # Función para calcular porcentaje de hombres (Gender es 1=Masculino, 2=Femenino)
        def pct_male(genders):
            if len(genders) == 0:
                return 0.5
            return (genders == 1).mean()
        
        # Agregar por proveedor para test_final.csv (predicción) - LÓGICA ORIGINAL
        agg_by_provider = claims.groupby('Provider').agg({
            'InscClaimAmtReimbursed': ['sum', 'mean'],
            'ClaimID': 'count',
            'BeneID': pd.Series.nunique,
            'Age': 'mean' if 'Age' in claims.columns else lambda x: 0.0,
            'Gender': pct_male if 'Gender' in claims.columns else lambda x: 0.5,
        }).reset_index()
        
        # Aplanar columnas multi-nivel
        if isinstance(agg_by_provider.columns, pd.MultiIndex):
            agg_by_provider.columns = [f"{col[0]}_{col[1]}" if col[1] else col[0] 
                                     for col in agg_by_provider.columns]
        
        # Log para diagnosticar las columnas generadas
        logger.info(f"Columnas después de aplanar: {list(agg_by_provider.columns)}")
        
        # Renombrar columnas correctamente
        column_mapping = {
            'InscClaimAmtReimbursed_sum': 'Total_Reimbursed',
            'InscClaimAmtReimbursed_mean': 'Mean_Reimbursed',
            'ClaimID_count': 'Claim_Count',
            'BeneID_nunique': 'Unique_Beneficiaries',
            'Age_mean': 'Avg_Beneficiary_Age',
            'Gender_pct_male': 'Pct_Male',
            'Gender_<lambda>': 'Pct_Male'
        }
        
        # Log para diagnosticar el mapeo
        logger.info(f"Intentando mapear columnas: {column_mapping}")
        
        # Aplicar mapeo de columnas
        for old_col, new_col in column_mapping.items():
            if old_col in agg_by_provider.columns:
                agg_by_provider = agg_by_provider.rename(columns={old_col: new_col})
                logger.info(f"Mapeado: {old_col} -> {new_col}")
            else:
                logger.warning(f"Columna no encontrada para mapeo: {old_col}")
        
        # Log después del mapeo
        logger.info(f"Columnas después del mapeo: {list(agg_by_provider.columns)}")
        
        # Verificar que Pct_Male existe, si no, crear con valor por defecto
        if 'Pct_Male' not in agg_by_provider.columns:
            agg_by_provider['Pct_Male'] = 0.5
            logger.warning("Columna Pct_Male no encontrada, usando valor por defecto 0.5")
        
        # Limpiar datos
        final_df = agg_by_provider.fillna(0)
        
        # Asegurar tipos de datos correctos
        for feature in ['Total_Reimbursed', 'Mean_Reimbursed', 'Claim_Count', 'Unique_Beneficiaries', 'Pct_Male']:
            if feature in final_df.columns:
                final_df[feature] = pd.to_numeric(final_df[feature], errors='coerce').fillna(0)
        
        # Guardar test_final.csv (SIN LIMITAR A 30)
        final_df.to_csv(OUTPUT_FILE, index=False)
        logger.info(f"Archivo test_final.csv guardado en: {OUTPUT_FILE} con {len(final_df)} providers")
        logger.info(f"Columnas finales en test_final.csv: {list(final_df.columns)}")
        
        # NOTA: test_dashboard.csv se genera por separado usando dashboard_ingestor.py
        
    except Exception as e:
        logger.error(f"Error procesando archivos: {e}")
        raise

def generate_demo_data():
    # Implementa la lógica para generar datos simulados
    pass

if __name__ == '__main__':
    process_test_files() 