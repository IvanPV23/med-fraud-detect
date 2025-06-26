# Sistema de Detección de Fraude Médico

Un sistema completo para la detección de fraude en reclamaciones médicas utilizando machine learning con XGBoost y una interfaz web moderna.

## 🏗️ Arquitectura del Sistema

```
proyecto-ia/
├── backend/                 # Servidor FastAPI con modelo ML
│   ├── agents/             # Agentes de procesamiento
│   │   ├── ingestor.py     # Procesamiento de datos CSV
│   │   └── predictor.py    # Predicciones con modelo XGBoost
│   ├── data/               # Datos y archivos procesados
│   │   ├── uploads/        # Archivos CSV subidos
│   │   └── processed/      # Datos procesados (test_final.csv)
│   ├── models/             # Modelo entrenado
│   │   └── xgb_fraud_model.pkl
│   ├── metrics/            # Métricas del modelo
│   │   └── xgb_fraud_metrics.json
│   ├── main.py             # Servidor FastAPI
│   └── requirements.txt    # Dependencias Python
└── frontend/               # Aplicación React
    ├── src/
    │   ├── components/     # Componentes React
    │   ├── services/       # Servicios de API
    │   └── App.tsx         # Aplicación principal
    └── public/
        └── data/           # Datos de muestra
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Python 3.8+
- Node.js 16+
- npm o yarn

### Backend (Python/FastAPI)

1. **Navegar al directorio backend:**
   ```bash
   cd backend
   ```

2. **Crear entorno virtual:**
   ```bash
   python -m venv venv
   ```

3. **Activar entorno virtual:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Ejecutar el servidor:**
   ```bash
   python main.py
   ```

El servidor estará disponible en `http://localhost:8000`

### Frontend (React)

1. **Navegar al directorio frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:5173`

## 📊 Características del Sistema

### Backend API

- **POST /upload** - Subir archivos CSV
- **POST /ingest** - Procesar datos y generar features
- **POST /predict** - Realizar predicciones de fraude
- **GET /metricas** - Obtener métricas del modelo
- **GET /health** - Verificar estado del sistema

### Frontend

- **Página de Inicio** - Descripción del sistema
- **Bulk Input** - Subida masiva de archivos CSV
- **Model Overview** - Métricas y rendimiento del modelo
- **Single Prediction** - Predicciones individuales

### Modelo ML

- **Algoritmo:** XGBoost
- **Features:** Total_Reimbursed, Mean_Reimbursed, Claim_Count, Unique_Beneficiaries, Pct_Male
- **Métricas:** ROC-AUC: 94.64%, Precision: 54.86%, Recall: 75.59%

## 📁 Formato de Datos

### CSV de Entrada Requerido

```csv
Provider,TotalClaims,NumInpatientClaims,NumOutpatientClaims,TotalAmountReimbursed,MeanAmountReimbursed,AvgClaimDurationDays,NumUniqueDiagnosisCodes,NumUniqueProcedureCodes,NumUniqueBeneficiaries
PROVIDER001,1250,45,1205,4500000,3600,12.5,85,120,980
```

### CSV de Salida

```csv
Provider,Prediccion,Probabilidad_Fraude
PROVIDER001,0,0.2345
PROVIDER002,1,0.7890
```

## 🧪 Pruebas

### Probar la API

```bash
cd backend
python test_api.py
```

### Probar el Frontend

1. Abrir `http://localhost:5173`
2. Ir a "Bulk Input"
3. Cargar datos de muestra
4. Ejecutar predicciones

## 🔧 Uso del Sistema

### 1. Subir Datos

1. Navegar a "Bulk Input" en el frontend
2. Arrastrar y soltar archivo CSV o hacer clic en "Choose File"
3. Verificar que el archivo tenga las columnas requeridas
4. El archivo se subirá automáticamente al backend

### 2. Procesar Datos

1. Hacer clic en "Run Batch Prediction"
2. El sistema procesará los datos y generará las features
3. Se ejecutarán las predicciones automáticamente

### 3. Ver Resultados

1. Los resultados se mostrarán en una tabla
2. Cada provider tendrá:
   - Predicción (Fraude/No Fraude)
   - Probabilidad de fraude
3. Descargar resultados en CSV

### 4. Ver Métricas del Modelo

1. Navegar a "Model Overview"
2. Ver métricas de rendimiento
3. Analizar importancia de features

## 🛠️ Desarrollo

### Estructura de Agentes

#### DataIngestor (`agents/ingestor.py`)
- Procesa archivos CSV brutos
- Genera features requeridas por el modelo
- Valida formato de datos
- Crea `test_final.csv`

#### FraudPredictor (`agents/predictor.py`)
- Carga modelo XGBoost
- Realiza predicciones
- Retorna probabilidades
- Maneja errores de modelo

### Endpoints API

```python
# Subir archivo
POST /upload
Content-Type: multipart/form-data
file: CSV file

# Procesar datos
POST /ingest
Response: {"success": true, "message": "..."}

# Predicciones
POST /predict
Response: {"predictions": [{"Provider": "...", "Prediccion": 0, "Probabilidad_Fraude": 0.123}]}

# Métricas
GET /metricas
Response: {"metrics": {...}, "model_info": {...}}
```

## 📈 Métricas del Modelo

- **ROC-AUC:** 0.9464 (94.64%)
- **Precision:** 0.5486 (54.86%)
- **Recall:** 0.7559 (75.59%)
- **F1-Score:** 0.6358 (63.58%)

## 🔍 Troubleshooting

### Problemas Comunes

1. **Error de CORS**
   - Verificar que el backend esté corriendo en puerto 8000
   - Verificar configuración CORS en `main.py`

2. **Error de Modelo**
   - Verificar que `xgb_fraud_model.pkl` existe en `models/`
   - Verificar que las dependencias estén instaladas

3. **Error de Datos**
   - Verificar formato CSV
   - Verificar columnas requeridas
   - Verificar tipos de datos

### Logs

Los logs se muestran en la consola del backend:
```
INFO:__main__:Archivo subido: sample-providers.csv
INFO:agents.ingestor:Procesando archivo: data/uploads/sample-providers.csv
INFO:agents.predictor:Predicciones completadas para 20 providers
```

## 📝 Notas Técnicas

- El modelo XGBoost fue entrenado con datos de reclamaciones médicas
- Las features se calculan automáticamente desde los datos brutos
- El sistema maneja errores de forma robusta
- La interfaz es responsive y moderna
- El código está bien documentado y modular

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles. 