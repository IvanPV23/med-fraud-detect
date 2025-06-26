import requests
import pandas as pd
import math
import numpy as np

# 1. Llamada a ingestion_agent
resp_ing = requests.post(
    "http://localhost:8001/ingest",
    json={"data_path": "data"}
)
resp_ing.raise_for_status()
print("Ingest response:", resp_ing.json())

# 2. Carga de CSVs localmente
df_ben = pd.read_csv("data/Train_Beneficiarydata-1542865627584.csv")
df_ip = pd.read_csv(
    "data/Train_Inpatientdata-1542865627584.csv",
    parse_dates=['ClaimStartDt','ClaimEndDt','AdmissionDt','DischargeDt']
)
df_op = pd.read_csv(
    "data/Train_Outpatientdata-1542865627584.csv",
    parse_dates=['ClaimStartDt','ClaimEndDt']
)
df_prov = pd.read_csv("data/Train-1542865627584.csv")

def prepare_records(df):
    df_clean = df.copy()

    for col in df_clean.columns:
        # Convertir fechas a string
        if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
            df_clean[col] = df_clean[col].astype(str)

        # Reemplazar valores infinitos y NaNs en columnas numéricas
        elif pd.api.types.is_numeric_dtype(df_clean[col]):
            df_clean[col] = df_clean[col].replace([np.inf, -np.inf], 0.0)
            df_clean[col] = df_clean[col].fillna(0.0)

        # Reemplazar NaNs en columnas categóricas con string vacío
        else:
            df_clean[col] = df_clean[col].fillna("")

    # Si aún queda algo raro, convertir todo a string (última defensa)
    return df_clean.astype(str).to_dict(orient="records")

# Para test, selecciono los primeros 100
# Aplicar limpieza a cada lista
payload = {
    "beneficiaries": prepare_records(df_ben.head(100)),
    "inpatient": prepare_records(df_ip.head(100)),
    "outpatient": prepare_records(df_op.head(100)),
    "providers": prepare_records(df_prov.head(100))
}
# 3. Llamada a feature_agent
resp_feat = requests.post(
    "http://localhost:8002/features",
    json=payload
)
resp_feat.raise_for_status()
features = resp_feat.json()

print("Feature response: Procesados =", len(features))
print("Primer proveedor:", features[0])
